/** Resolves which weather and sounds apply right now, from the view, the user's pick and events (pure). */
import type { Weather, WorldView } from '../content/schema/world'

export interface AtmosphereInput {
  presets: readonly Weather[]
  picked: string
  view: WorldView | undefined
  /** A scenario landmark is selected (a crisis plays out in a storm). */
  atScenario: string | null
  /** Celebration preset after a journey completes (temporary), or null. */
  celebrating: string | null
}

/** Priority: celebration > scenario storm > the view's own weather > the user's pick. */
export function resolveWeather(i: AtmosphereInput): Weather {
  const id = i.celebrating ?? i.atScenario ?? i.view?.weather ?? i.picked
  return i.presets.find((p) => p.id === id) ?? i.presets.find((p) => p.id === i.picked) ?? i.presets[0]!
}

/** Ambience level per key: weather sounds scale with intensity, birds only by day, crickets only at night. */
export function ambienceLevels(w: Weather, view: WorldView | undefined, daylight: number): Record<string, number> {
  const out: Record<string, number> = {}
  const add = (k: string, v: number) => (out[k] = Math.max(out[k] ?? 0, Math.min(1, v)))
  for (const k of w.ambience) {
    if (k === 'rain') add(k, 0.25 + 0.75 * w.rain)
    else if (k === 'wind') add(k, 0.2 + 0.8 * w.wind)
    else add(k, 0.6)
  }
  for (const k of view?.ambience ?? []) add(k, 0.7)
  if (out.birds !== undefined) out.birds *= daylight
  if (daylight < 0.3 && w.rain < 0.3 && w.snow === 0) add('crickets', 0.5 * (1 - daylight))
  if (out.crickets !== undefined) out.crickets *= 1 - daylight
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v > 0.01))
}
