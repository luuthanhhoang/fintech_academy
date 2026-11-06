import { describe, expect, it } from 'vitest'
import { buildCatalog } from '@/lib/content/catalog'
import { loadContent } from '@/lib/content/load'
import { chatterKey, villagerLine } from '@/lib/world/chatter'
import { plotHealth, type PlotHealth } from '@/lib/world/health'
import { buildWorldLayout } from '@/lib/world/layout'
import { createPolyline } from '@/lib/world/polyline'
import { bridgeDeck, bridgeSpans, busAt, roadProfile } from '@/lib/world/roads'
import { createTerrain } from '@/lib/world/terrain'
import { arrivalPoint, CircleGrid, collidersFor, frontierStation, nearestReachable, rayGround, reachablesFor, resolveCollisions, stepWalk, waterSurface } from '@/lib/world/walk'

const catalog = buildCatalog(loadContent())
const terrain = createTerrain(catalog.world.map)
const layout = buildWorldLayout(catalog, terrain)
const player = catalog.world.map.player
const env = { terrain, player, grid: new CircleGrid(collidersFor(layout)) }
const score = (value: number, retention: number) => ({ score: value, quiz: value, retention, attempts: 1, reviewedCards: 1 })

describe('walking', () => {
  it('moves at walk speed and faster when running', () => {
    const st = layout.stations[0]!
    let s = { x: st.position[0], z: st.position[2], y: 0, yaw: 0, speed: player.walkSpeed, swimming: false }
    s = stepWalk(s, { x: 1, z: 0, run: false }, 0.1, env)
    expect(s.speed).toBeLessThanOrEqual(player.walkSpeed + 1e-9)
    let r = { ...s, speed: player.walkSpeed }
    for (let i = 0; i < 20; i++) r = stepWalk(r, { x: 1, z: 0, run: true }, 0.1, env)
    expect(r.speed).toBeGreaterThan(player.walkSpeed * 1.5)
  })

  it('cannot walk through a house', () => {
    const lot = layout.lots[0]!
    const [x, z] = resolveCollisions(lot.house[0] + 0.5, lot.house[2], player.radius, env.grid)
    expect(Math.hypot(x - lot.house[0], z - lot.house[2])).toBeGreaterThanOrEqual(3.4 + player.radius - 1e-6)
  })

  it('swims in a lake and stands on dry land', () => {
    const lake = terrain.lakes.find((l) => l.kind === 'lake')!
    expect(waterSurface(terrain, lake.center[0], lake.center[1])).toBe(lake.surface)
    const s = stepWalk({ x: lake.center[0], z: lake.center[1], y: 0, yaw: 0, speed: 0, swimming: false }, { x: 0, z: 0, run: false }, 0.1, env)
    expect(s.swimming).toBe(true)
    const st = layout.stations[0]!
    expect(waterSurface(terrain, st.position[0], st.position[2])).toBeNull()
  })

  it('finds the nearest enterable place within reach', () => {
    const items = reachablesFor(layout, new Map())
    const lot = layout.lots[0]!
    const hit = nearestReachable(items, lot.house[0] + 5, lot.house[2], player.interactRadius)
    expect(hit).not.toBeNull()
    expect(nearestReachable(items, 5000, 5000, player.interactRadius)).toBeNull()
  })

  it('picks the ground under a downward ray', () => {
    const hit = rayGround([0, 50, 0], [0, -1, 0], () => 3)
    expect(hit![1]).toBeCloseTo(3, 3)
    expect(rayGround([0, 50, 0], [0, 1, 0], () => 3)).toBeNull()
  })

  it('arrives on dry land next to a place', () => {
    const lm = layout.landmarks[0]!
    const [x, z] = arrivalPoint(terrain, lm.position[0], lm.position[2], 8)
    expect(terrain.isWet(x, z)).toBe(false)
    expect(Math.hypot(x - lm.position[0], z - lm.position[2])).toBeGreaterThanOrEqual(8 - 1e-6)
  })

  it('starts at the first station with unfinished, unlocked concepts', () => {
    const health = new Map<string, PlotHealth>()
    for (const c of catalog.concepts) health.set(c.id, plotHealth('mastered', score(1, 1), 0.7))
    const line = [...layout.stations].sort((a, b) => a.t - b.t)
    const target = line[2]!
    const lot = layout.lots.find((l) => l.stageId === target.id)!
    health.set(lot.conceptId, plotHealth('learning', undefined, 0.7))
    expect(frontierStation(layout, health)?.id).toBe(target.id)
  })
})

describe('road', () => {
  it('lifts a deck over water with ramps, and marks the span as a bridge', () => {
    const line = createPolyline([[0, 0], [100, 0]])
    const samples = roadProfile(line, 2, () => 0, (x) => (x > 40 && x < 60 ? 1 : null))
    const mid = samples[25]!
    expect(mid.y).toBeCloseTo(2.4, 5)
    expect(mid.bridge).toBe(true)
    expect(samples[0]!.y).toBe(0)
    // Ramps fall no faster than the grade.
    for (let i = 1; i < samples.length; i++) expect(Math.abs(samples[i]!.y - samples[i - 1]!.y)).toBeLessThanOrEqual(0.14 * 2 + 1e-9)
    expect(bridgeSpans(samples).length).toBe(1)
  })

  it('crosses the river on a bridge in the real map', () => {
    expect(bridgeSpans(layout.road.samples).length).toBeGreaterThan(0)
    const s = layout.road.samples.find((x) => x.bridge)!
    expect(bridgeDeck(layout.road, s.x, s.z)).not.toBeNull()
  })

  it('runs the bus stop to stop, waiting at each', () => {
    const at0 = busAt([0, 0.5, 1], 1000, 10, 5, 2)
    expect(at0).toEqual({ t: 0, forward: true, waiting: true })
    const moving = busAt([0, 0.5, 1], 1000, 10, 5, 30)
    expect(moving.waiting).toBe(false)
    expect(moving.t).toBeGreaterThan(0)
    expect(moving.t).toBeLessThan(0.5)
  })

  it('places one school and one bus stop per region, off the road', () => {
    expect(layout.schools.length).toBe(catalog.world.map.regions.length)
    expect(layout.busStops.length).toBe(catalog.world.map.regions.length)
    for (const s of layout.schools) expect(layout.road.line.nearest(s.position[0], s.position[2]).distance).toBeGreaterThan(layout.road.width)
  })
})

describe('villager chatter', () => {
  it('talks about the nearest plot from its real state', () => {
    const lot = layout.lots[0]!
    const t = catalog.world.map.people.chatter
    const names = new Map([[lot.conceptId, 'Lãi kép']])
    const seed = villagerLine([lot], new Map(), names, t, lot.plot[0], lot.plot[2])
    expect(seed).toBe(t.seed.replaceAll('{concept}', 'Lãi kép'))
    const weeds = plotHealth('learning', score(0.6, 0.2), 0.7)
    expect(chatterKey(weeds)).toBe('weeds')
    expect(chatterKey(plotHealth('locked', undefined, 0.7))).toBe('locked')
  })
})
