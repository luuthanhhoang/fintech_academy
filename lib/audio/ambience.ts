/** Synthesised ambience loops keyed by AMBIENCE_KEYS, plus one-shot thunder and chime. */
import type { AmbienceKey } from '../registry/keys'
import { chain, envelope, filter, gain, lfo, noiseSource } from './nodes'

export interface Voice {
  stop(): void
}

type Make = (ctx: AudioContext, out: AudioNode) => Voice

function loop(ctx: AudioContext, sources: AudioScheduledSourceNode[]): Voice {
  sources.forEach((s) => s.start())
  return { stop: () => sources.forEach((s) => s.stop(ctx.currentTime + 0.05)) }
}

const rain: Make = (ctx, out) => {
  const hiss = noiseSource(ctx, 'white')
  chain(hiss, filter(ctx, 'highpass', 900), filter(ctx, 'lowpass', 7000), gain(ctx, 0.35), out)
  const body = noiseSource(ctx, 'pink')
  chain(body, filter(ctx, 'lowpass', 1200), gain(ctx, 0.5), out)
  return loop(ctx, [hiss, body])
}

const wind: Make = (ctx, out) => {
  const src = noiseSource(ctx, 'pink')
  const bp = filter(ctx, 'bandpass', 420, 0.8)
  const g = gain(ctx, 0.6)
  chain(src, bp, g, out)
  src.start()
  const a = lfo(ctx, bp.frequency, 0.07, 220)
  const b = lfo(ctx, g.gain, 0.11, 0.35)
  return { stop: () => [src, a, b].forEach((n) => n.stop()) }
}

const waves: Make = (ctx, out) => {
  const src = noiseSource(ctx, 'brown')
  const lp = filter(ctx, 'lowpass', 600)
  const g = gain(ctx, 0.5)
  chain(src, lp, g, out)
  src.start()
  const a = lfo(ctx, g.gain, 0.09, 0.45)
  const b = lfo(ctx, lp.frequency, 0.09, 350)
  return { stop: () => [src, a, b].forEach((n) => n.stop()) }
}

const stream: Make = (ctx, out) => {
  const src = noiseSource(ctx, 'white')
  const bp = filter(ctx, 'bandpass', 1400, 1.4)
  const g = gain(ctx, 0.25)
  chain(src, bp, g, out)
  src.start()
  const a = lfo(ctx, bp.frequency, 3.1, 500)
  return { stop: () => [src, a].forEach((n) => n.stop()) }
}

function chirps(ctx: AudioContext, everyMs: number, play: (t: number) => void): Voice {
  const id = window.setInterval(() => {
    if (Math.random() < 0.55) play(ctx.currentTime + Math.random() * 0.4)
  }, everyMs)
  return { stop: () => window.clearInterval(id) }
}

const birds: Make = (ctx, out) =>
  chirps(ctx, 1300, (t) => {
    const notes = 2 + Math.floor(Math.random() * 4)
    const base = 2600 + Math.random() * 1800
    for (let i = 0; i < notes; i++) {
      const o = ctx.createOscillator()
      const g = gain(ctx, 0)
      o.connect(g).connect(out)
      const s = t + i * 0.13
      o.frequency.setValueAtTime(base, s)
      o.frequency.exponentialRampToValueAtTime(base * (1.2 + Math.random() * 0.4), s + 0.08)
      envelope(g.gain, s, 0.05, 0.01, 0.09)
      o.start(s)
      o.stop(s + 0.12)
    }
  })

const crickets: Make = (ctx, out) =>
  chirps(ctx, 700, (t) => {
    const o = ctx.createOscillator()
    o.frequency.value = 4300 + Math.random() * 400
    const g = gain(ctx, 0)
    o.connect(g).connect(out)
    for (let i = 0; i < 4; i++) envelope(g.gain, t + i * 0.05, 0.025, 0.005, 0.03)
    o.start(t)
    o.stop(t + 0.25)
  })

const train: Make = (ctx, out) => {
  const rumble = noiseSource(ctx, 'brown')
  chain(rumble, filter(ctx, 'lowpass', 180), gain(ctx, 0.7), out)
  rumble.start()
  let beat = 0
  const id = window.setInterval(() => {
    const t = ctx.currentTime + 0.02
    const click = noiseSource(ctx, 'white')
    const g = gain(ctx, 0)
    chain(click, filter(ctx, 'bandpass', beat % 2 ? 900 : 650, 3), g, out)
    envelope(g.gain, t, 0.18, 0.002, 0.08)
    click.start(t)
    click.stop(t + 0.12)
    beat++
  }, 360)
  return { stop: () => (window.clearInterval(id), rumble.stop()) }
}

export const AMBIENCE: Record<AmbienceKey, Make> = { rain, wind, waves, stream, birds, crickets, train }

/** Rolling thunder; `distance` 0 (overhead) … 1 (far) changes loudness and brightness. */
export function thunder(ctx: AudioContext, out: AudioNode, distance: number) {
  const t = ctx.currentTime + 0.2 + distance * 2.5
  const src = noiseSource(ctx, 'brown')
  const lp = filter(ctx, 'lowpass', 900 - distance * 600)
  const g = gain(ctx, 0)
  chain(src, lp, g, out)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(1.1 - distance * 0.7, t + 0.15)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 4 + distance * 2)
  src.start(t)
  src.stop(t + 6.5)
}

/** Soft two-note chime for segment and break ends. */
export function chime(ctx: AudioContext, out: AudioNode) {
  ;[880, 1318.5].forEach((hz, i) => {
    const o = ctx.createOscillator()
    o.frequency.value = hz
    const g = gain(ctx, 0)
    o.connect(g).connect(out)
    const t = ctx.currentTime + i * 0.25
    envelope(g.gain, t, 0.12, 0.01, 1.6)
    o.start(t)
    o.stop(t + 1.8)
  })
}
