import { describe, expect, it } from 'vitest'
import { buildCatalog } from '@/lib/content/catalog'
import { loadContent } from '@/lib/content/load'
import { ambienceLevels, resolveWeather } from '@/lib/world/atmosphere'
import { plotHealth } from '@/lib/world/health'
import { buildWorldLayout } from '@/lib/world/layout'
import { plantsFromSessions } from '@/lib/world/plants'
import { chaikin, createPolyline } from '@/lib/world/polyline'
import { daylight, moonPhase, moonPhaseName, sunPosition } from '@/lib/world/sky'
import { createTerrain } from '@/lib/world/terrain'
import type { FocusSessionRecord } from '@/lib/db/types'

const catalog = buildCatalog(loadContent())
const terrain = createTerrain(catalog.world.map)
const layout = buildWorldLayout(catalog, terrain)

describe('polyline', () => {
  it('measures arc length and finds the nearest point', () => {
    const p = createPolyline([[0, 0], [10, 0], [10, 10]])
    expect(p.length).toBe(20)
    expect(p.at(0.75)).toEqual([10, 5])
    const n = p.nearest(4, 3)
    expect(n.distance).toBeCloseTo(3)
    expect(n.t).toBeCloseTo(0.2)
  })
  it('chaikin keeps endpoints', () => {
    const s = chaikin([[0, 0], [10, 0], [10, 10]], 2)
    expect(s[0]).toEqual([0, 0])
    expect(s[s.length - 1]).toEqual([10, 10])
  })
})

describe('terrain', () => {
  const m = catalog.world.map
  it('is deterministic and puts the sea below sea level', () => {
    expect(createTerrain(m).height(12, 34)).toBe(terrain.height(12, 34))
    expect(terrain.height(0, m.size / 2 - 5)).toBeLessThan(0)
  })
  it('carves rivers and lakes below their banks', () => {
    for (const l of terrain.lakes) expect(terrain.height(l.center[0], l.center[1])).toBeLessThan(l.surface)
    const r = terrain.rivers[0]!
    const [x, z] = r.line.at(0.5)
    expect(terrain.height(x, z)).toBeLessThan(r.surface(0.5))
    expect(terrain.isWet(x, z)).toBe(true)
  })
  it('keeps the rail above water along its whole length', () => {
    for (let t = 0; t <= 1; t += 0.02) expect(terrain.railHeight(t)).toBeGreaterThan(2)
  })
  it('peaks rise above the snowline', () => {
    const p = m.peaks.find((x) => x.height > m.snowline)!
    expect(terrain.height(p.at[0], p.at[1])).toBeGreaterThan(m.snowline)
  })
})

describe('layout from content', () => {
  it('has one station per stage, one lot per concept and one building per landmark', () => {
    expect(layout.stations.length).toBe(catalog.tracks.reduce((a, t) => a + t.stages.length, 0))
    expect(layout.lots.length).toBe(catalog.concepts.length)
    expect(layout.landmarks.length).toBe(catalog.world.landmarks.length)
    expect(layout.guides.length).toBe(catalog.world.guides.length)
  })
  it('builds nothing in water', () => {
    for (const l of layout.lots) expect(terrain.isWet(l.house[0], l.house[2])).toBe(false)
    for (const l of layout.landmarks) expect(terrain.isWet(l.position[0], l.position[2])).toBe(false)
  })
  it('places a landmark next to the station of the first lesson using it', () => {
    const bank = layout.landmarks.find((l) => l.landmark.ref.id === 'tvm')!
    const lesson = catalog.lessons.filter((l) => l.simulators.includes('tvm')).sort((a, b) => a.order - b.order)[0]!
    expect(bank.stationId).toBe(lesson.stage)
  })
})

describe('sky', () => {
  it('sun is high at noon and below the horizon at midnight', () => {
    const d = new Date(2026, 5, 21)
    expect(sunPosition(d, 12, 21).elevation).toBeGreaterThan(1.2)
    expect(sunPosition(d, 0, 21).elevation).toBeLessThan(0)
    expect(daylight(sunPosition(d, 0, 21).elevation)).toBe(0)
  })
  it('moon phase matches a known full moon (2024-01-25 17:54 UTC)', () => {
    const p = moonPhase(new Date(Date.UTC(2024, 0, 25, 17, 54)))
    expect(p.illumination).toBeGreaterThan(0.98)
    expect(moonPhaseName(p.age)).toBe('Trăng tròn')
  })
})

describe('health and atmosphere', () => {
  it('weeds grow when retention decays; mastered concepts light up', () => {
    expect(plotHealth('learning', { score: 0.6, quiz: 0.8, retention: 0.4, attempts: 3, reviewedCards: 1 }, 0.6).weeds).toBe(true)
    expect(plotHealth('mastered', { score: 0.9, quiz: 0.9, retention: 0.9, attempts: 5, reviewedCards: 2 }, 0.6).lit).toBe(true)
    expect(plotHealth('locked', undefined, 0.6).growth).toBe(0)
  })
  it('celebration overrides the view weather; crickets only at night', () => {
    const w = catalog.world.weather
    const view = catalog.world.views.find((v) => v.weather)!
    expect(resolveWeather({ presets: w.presets, picked: w.defaultWeather, view, atScenario: null, celebrating: w.celebration }).id).toBe(w.celebration)
    expect(resolveWeather({ presets: w.presets, picked: w.defaultWeather, view, atScenario: null, celebrating: null }).id).toBe(view.weather)
    const clear = w.presets.find((p) => p.rain === 0 && p.snow === 0)!
    expect(ambienceLevels(clear, undefined, 0).crickets).toBeGreaterThan(0)
    expect(ambienceLevels(clear, undefined, 1).crickets).toBeUndefined()
  })
})

describe('plants', () => {
  const base: FocusSessionRecord = {
    id: 1, day: '2026-11-05', journeyId: 'j', viewId: 'v', segment: 0, segments: 1, startedAt: new Date(), endedAt: new Date(),
    plannedMs: 1_440_000, focusedMs: 1_440_000, status: 'completed', reason: 'finished', regionId: catalog.world.map.regions[0]!.id, task: null,
  }
  it('plants one tree per long enough segment, withered when abandoned, on dry land', () => {
    const plants = plantsFromSessions([base, { ...base, id: 2, status: 'abandoned', reason: 'hidden' }, { ...base, id: 3, focusedMs: 60_000 }], catalog, layout, terrain)
    expect(plants).toHaveLength(2)
    expect(plants[1]!.withered).toBe(true)
    for (const p of plants) expect(terrain.isWet(p.position[0], p.position[2])).toBe(false)
  })
})
