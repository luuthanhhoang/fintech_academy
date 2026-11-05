/** Generative music theory (pure): chords and melody notes from a piece's scale and progression. */
import type { MusicPiece } from '../content/schema/world'

export const STEPS_PER_BAR = 8

export function midiToHz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12)
}

/** MIDI note of scale degree `deg` (may exceed the scale length: wraps into higher octaves). */
export function degreeToMidi(piece: Pick<MusicPiece, 'root' | 'scale'>, deg: number): number {
  const n = piece.scale.length
  const octave = Math.floor(deg / n)
  const idx = ((deg % n) + n) % n
  return piece.root + octave * 12 + piece.scale[idx]!
}

/** Triad stacked in thirds of the scale on the bar's chord degree. */
export function chordForBar(piece: Pick<MusicPiece, 'root' | 'scale' | 'progression'>, bar: number): number[] {
  const deg = piece.progression[bar % piece.progression.length]!
  return [0, 2, 4].map((k) => degreeToMidi(piece, deg + k))
}

/**
 * Melody note for one step, or null for a rest. Chord tones are favoured on strong steps; motion is stepwise
 * around the previous note so lines stay singable.
 */
export function melodyStep(piece: Pick<MusicPiece, 'root' | 'scale' | 'progression' | 'density'>, bar: number, step: number, prev: number | null, rand: () => number): number | null {
  const strong = step % 4 === 0
  if (rand() > piece.density * (strong ? 1.6 : 1)) return null
  const chord = chordForBar(piece, bar).map((m) => m + 12)
  if (strong || prev === null) return chord[Math.floor(rand() * chord.length)]!
  const n = piece.scale.length
  const prevDeg = nearestDegree(piece, prev)
  const move = [-2, -1, -1, 1, 1, 2][Math.floor(rand() * 6)]!
  return degreeToMidi(piece, Math.max(n, Math.min(n * 3 - 1, prevDeg + move)))
}

/** Scale degree whose pitch is closest to `midi`. */
export function nearestDegree(piece: Pick<MusicPiece, 'root' | 'scale'>, midi: number): number {
  let best = 0
  let dist = Infinity
  for (let d = 0; d < piece.scale.length * 4; d++) {
    const m = degreeToMidi(piece, d)
    if (Math.abs(m - midi) < dist) {
      dist = Math.abs(m - midi)
      best = d
    }
  }
  return best
}

export function stepSeconds(bpm: number): number {
  return 60 / bpm / 2
}
