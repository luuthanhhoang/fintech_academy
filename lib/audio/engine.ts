/**
 * Browser audio engine: ambience loops with per-key levels, a generative music scheduler and one-shots.
 * Created only after a user gesture (browsers block audio before that).
 */
import type { MusicPiece } from '../content/schema/world'
import { mulberry32 } from '../finance/random'
import { isAmbienceKey, isMusicLayerKey } from '../registry/keys'
import { AMBIENCE, chime, thunder, type Voice } from './ambience'
import { INSTRUMENTS } from './instruments'
import { chordForBar, melodyStep, STEPS_PER_BAR, stepSeconds } from './music'
import { gain } from './nodes'

const LOOKAHEAD_S = 0.4

export class AudioEngine {
  readonly ctx: AudioContext
  private master: GainNode
  private music: GainNode
  private ambience: GainNode
  private voices = new Map<string, { voice: Voice; level: GainNode }>()
  private timer: number | null = null

  constructor() {
    this.ctx = new AudioContext()
    this.master = gain(this.ctx, 0.8)
    this.master.connect(this.ctx.destination)
    this.music = gain(this.ctx, 0.5)
    this.ambience = gain(this.ctx, 0.6)
    this.music.connect(this.master)
    this.ambience.connect(this.master)
  }

  setVolumes(v: { master: number; music: number; ambience: number }) {
    const t = this.ctx.currentTime
    this.master.gain.setTargetAtTime(v.master, t, 0.1)
    this.music.gain.setTargetAtTime(v.music, t, 0.1)
    this.ambience.gain.setTargetAtTime(v.ambience, t, 0.1)
  }

  /** Cross-fades to the requested ambience keys at the given levels (0–1). */
  setAmbience(levels: Record<string, number>) {
    const t = this.ctx.currentTime
    for (const [key, entry] of this.voices) {
      if ((levels[key] ?? 0) > 0) continue
      entry.level.gain.setTargetAtTime(0, t, 0.6)
      window.setTimeout(() => entry.voice.stop(), 2500)
      this.voices.delete(key)
    }
    for (const [key, level] of Object.entries(levels)) {
      if (level <= 0 || !isAmbienceKey(key)) continue
      const existing = this.voices.get(key)
      if (existing) {
        existing.level.gain.setTargetAtTime(level, t, 0.6)
        continue
      }
      const g = gain(this.ctx, 0)
      g.connect(this.ambience)
      g.gain.setTargetAtTime(level, t, 0.8)
      this.voices.set(key, { voice: AMBIENCE[key](this.ctx, g), level: g })
    }
  }

  playMusic(piece: MusicPiece | null) {
    if (this.timer !== null) window.clearInterval(this.timer)
    this.timer = null
    if (!piece) return
    const rand = mulberry32(piece.root * 131 + piece.bpm)
    const step = stepSeconds(piece.bpm)
    const layers = piece.layers.filter(isMusicLayerKey)
    let next = this.ctx.currentTime + 0.1
    let index = 0
    let prev: number | null = null
    this.timer = window.setInterval(() => {
      while (next < this.ctx.currentTime + LOOKAHEAD_S) {
        const bar = Math.floor(index / STEPS_PER_BAR)
        const s = index % STEPS_PER_BAR
        const chord = chordForBar(piece, bar)
        for (const layer of layers) {
          const play = INSTRUMENTS[layer]
          if (layer === 'pad' && s === 0) chord.forEach((m) => play(this.ctx, this.music, next, m, step * STEPS_PER_BAR))
          if (layer === 'bass' && s % 4 === 0) play(this.ctx, this.music, next, chord[0]!, step * 3.5)
          if (layer === 'bell' || layer === 'pluck') {
            const note = melodyStep(piece, bar, s, prev, rand)
            if (note !== null && (layer === 'bell' ? s % 2 === 0 : true)) {
              play(this.ctx, this.music, next, note, step)
              prev = note
            }
          }
        }
        next += step
        index++
      }
    }, 100)
  }

  thunder(distance: number) {
    thunder(this.ctx, this.ambience, distance)
  }

  chime() {
    chime(this.ctx, this.master)
  }

  async resume() {
    if (this.ctx.state === 'suspended') await this.ctx.resume()
  }

  dispose() {
    this.playMusic(null)
    this.setAmbience({})
    void this.ctx.close()
  }
}
