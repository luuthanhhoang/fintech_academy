/** Synthesised instruments for generative music, keyed by MUSIC_LAYER_KEYS. */
import type { MusicLayerKey } from '../registry/keys'
import { midiToHz } from './music'
import { envelope, filter, gain } from './nodes'

export type Instrument = (ctx: AudioContext, out: AudioNode, t: number, midi: number, dur: number) => void

function osc(ctx: AudioContext, type: OscillatorType, hz: number, detune = 0) {
  const o = ctx.createOscillator()
  o.type = type
  o.frequency.value = hz
  o.detune.value = detune
  return o
}

const pad: Instrument = (ctx, out, t, midi, dur) => {
  const g = gain(ctx, 0)
  const lp = filter(ctx, 'lowpass', 900, 0.4)
  g.connect(lp).connect(out)
  for (const d of [-8, 7]) {
    const o = osc(ctx, 'sawtooth', midiToHz(midi), d)
    o.connect(g)
    o.start(t)
    o.stop(t + dur + 2.5)
  }
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(0.05, t + Math.min(1.5, dur / 2))
  g.gain.setValueAtTime(0.05, t + dur)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 2.4)
}

const bell: Instrument = (ctx, out, t, midi) => {
  const hz = midiToHz(midi)
  const carrier = osc(ctx, 'sine', hz)
  const mod = osc(ctx, 'sine', hz * 3.5)
  const modGain = gain(ctx, hz * 1.2)
  mod.connect(modGain).connect(carrier.frequency)
  const g = gain(ctx, 0)
  carrier.connect(g).connect(out)
  envelope(g.gain, t, 0.09, 0.005, 2.2)
  envelope(modGain.gain, t, hz * 1.2, 0.005, 0.9)
  for (const o of [carrier, mod]) {
    o.start(t)
    o.stop(t + 2.4)
  }
}

const bass: Instrument = (ctx, out, t, midi, dur) => {
  const o = osc(ctx, 'triangle', midiToHz(midi - 12))
  const g = gain(ctx, 0)
  o.connect(g).connect(out)
  envelope(g.gain, t, 0.16, 0.02, Math.max(0.3, dur * 0.9))
  o.start(t)
  o.stop(t + dur + 0.2)
}

const pluck: Instrument = (ctx, out, t, midi) => {
  const o = osc(ctx, 'sawtooth', midiToHz(midi))
  const lp = filter(ctx, 'lowpass', 2400, 2)
  lp.frequency.setValueAtTime(2400, t)
  lp.frequency.exponentialRampToValueAtTime(300, t + 0.5)
  const g = gain(ctx, 0)
  o.connect(lp).connect(g).connect(out)
  envelope(g.gain, t, 0.07, 0.004, 0.6)
  o.start(t)
  o.stop(t + 0.7)
}

export const INSTRUMENTS: Record<MusicLayerKey, Instrument> = { pad, bell, bass, pluck }
