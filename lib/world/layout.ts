/**
 * Places everything on the map from content: stations from track stages, a house + plot per concept,
 * landmarks next to the station of the stage that first uses them, guides, features and scattered vegetation.
 * Pure and deterministic for a given catalog + map seed.
 */
import { stageRank, type Catalog } from '../content/catalog'
import type { Guide, Landmark, Region } from '../content/schema/world'
import { mulberry32 } from '../finance/random'
import type { Terrain } from './terrain'

export type Pos = [number, number, number]

export interface Station { id: string; trackId: string; regionId: string; title: string; t: number; position: Pos; tangent: [number, number] }
export interface Lot { conceptId: string; stageId: string; regionId: string; house: Pos; plot: Pos; rotation: number; plotKind: Region['plot'] }
export interface PlacedLandmark { landmark: Landmark; stationId: string; regionId: string; position: Pos; rotation: number }
export interface PlacedGuide { guide: Guide; position: Pos; rotation: number }
export interface Scatter { kind: string; position: Pos; scale: number; rotation: number }

export interface WorldLayout {
  stations: Station[]
  lots: Lot[]
  landmarks: PlacedLandmark[]
  guides: PlacedGuide[]
  features: { id: string; kind: string; name: string; position: Pos }[]
  trees: Scatter[]
  shrubs: Scatter[]
  /** Points people walk between, per region. */
  waypoints: Record<string, Pos[]>
}

type LayoutSource = Pick<Catalog, 'world' | 'tracks' | 'concepts' | 'lessons'>

class Occupancy {
  private cells = new Map<string, number>()
  constructor(private cell: number) {}
  private key(x: number, z: number) {
    return `${Math.floor(x / this.cell)}:${Math.floor(z / this.cell)}`
  }
  free(x: number, z: number, r: number) {
    for (let dx = -r; dx <= r; dx += this.cell) for (let dz = -r; dz <= r; dz += this.cell) if (this.cells.has(this.key(x + dx, z + dz))) return false
    return true
  }
  take(x: number, z: number, r: number) {
    for (let dx = -r; dx <= r; dx += this.cell) for (let dz = -r; dz <= r; dz += this.cell) this.cells.set(this.key(x + dx, z + dz), 1)
  }
}

function placeStations(src: LayoutSource, terrain: Terrain): Station[] {
  return src.world.map.regions.flatMap((region) => {
    const track = src.tracks.find((t) => t.id === region.track)
    if (!track) return []
    const stages = [...track.stages].sort((a, b) => a.order - b.order)
    const [t0, t1] = region.railSpan
    return stages.map((s, i) => {
      const t = t0 + ((i + 0.5) / stages.length) * (t1 - t0)
      const [x, z] = terrain.rail.at(t)
      return { id: s.id, trackId: track.id, regionId: region.id, title: s.title.vi, t, position: [x, terrain.railHeight(t), z] as Pos, tangent: terrain.rail.tangent(t) }
    })
  })
}

function buildable(terrain: Terrain, occ: Occupancy, x: number, z: number, r: number, maxSlope: number) {
  return !terrain.isWet(x, z) && terrain.slope(x, z) < maxSlope && occ.free(x, z, r) && terrain.rail.nearest(x, z).distance > r + terrain.map.rail.width * 2
}

function placeLots(src: LayoutSource, terrain: Terrain, stations: Station[], occ: Occupancy): Lot[] {
  const v = src.world.map.village
  const regions = new Map(src.world.map.regions.map((r) => [r.id, r]))
  return stations.flatMap((st) => {
    const concepts = src.concepts.filter((c) => c.stage === st.id)
    const [tx, tz] = st.tangent
    const [nx, nz] = [-tz, tx]
    return concepts.map((c, k) => {
      const col = k % v.lotsPerRow
      const row = Math.floor(k / v.lotsPerRow)
      const along = (col - (v.lotsPerRow - 1) / 2) * v.lotSpacing
      let spot: [number, number, number] = [st.position[0], st.position[2], 1]
      for (let attempt = 0; attempt < 12; attempt++) {
        const side = (row + attempt) % 2 === 0 ? 1 : -1
        const depth = v.offsetFromRail + (Math.floor(row / 2) + Math.floor(attempt / 2)) * v.lotSpacing * 1.7
        const x = st.position[0] + tx * along + nx * side * depth
        const z = st.position[2] + tz * along + nz * side * depth
        const px = x + nx * side * v.lotSpacing * 0.62
        const pz = z + nz * side * v.lotSpacing * 0.62
        if (buildable(terrain, occ, x, z, 5, 0.45) && buildable(terrain, occ, px, pz, 4, 0.45)) {
          spot = [x, z, side]
          break
        }
      }
      const [x, z, side] = spot
      const px = x + nx * side * v.lotSpacing * 0.62
      const pz = z + nz * side * v.lotSpacing * 0.62
      occ.take(x, z, 5)
      occ.take(px, pz, 4)
      const region = regions.get(st.regionId)!
      return {
        conceptId: c.id, stageId: st.id, regionId: st.regionId, plotKind: region.plot,
        house: [x, terrain.height(x, z), z] as Pos, plot: [px, terrain.height(px, pz), pz] as Pos,
        rotation: Math.atan2(st.position[0] - x, st.position[2] - z),
      }
    })
  })
}

function firstStageOf(src: LayoutSource, kind: Landmark['ref']['kind'], id: string): string | null {
  const rank = stageRank(src.tracks)
  const field = ({ simulator: 'simulators', lab: 'labs', case: 'cases', scenario: 'scenarios' } as const)[kind]
  const users = src.lessons.filter((l) => l[field].includes(id)).sort((a, b) => (rank.get(a.stage) ?? 0) - (rank.get(b.stage) ?? 0) || a.order - b.order)
  return users[0]?.stage ?? null
}

function ringSpot(terrain: Terrain, occ: Occupancy, center: Pos, start: number, r: number): [number, number] {
  for (let ring = 0; ring < 8; ring++) {
    for (let k = 0; k < 16; k++) {
      const a = start + k * 0.8 + ring * 0.37
      const rad = r + ring * 12
      const x = center[0] + Math.cos(a) * rad
      const z = center[2] + Math.sin(a) * rad
      if (buildable(terrain, occ, x, z, 9, 0.35)) return [x, z]
    }
  }
  return [center[0] + r, center[2]]
}

function placeLandmarks(src: LayoutSource, terrain: Terrain, stations: Station[], occ: Occupancy) {
  const v = src.world.map.village
  const byStation = new Map<string, number>()
  const landmarks: PlacedLandmark[] = []
  for (const lm of src.world.landmarks) {
    const stageId = firstStageOf(src, lm.ref.kind, lm.ref.id)
    const st = stations.find((s) => s.id === stageId) ?? stations[0]
    if (!st) continue
    const n = byStation.get(st.id) ?? 0
    byStation.set(st.id, n + 1)
    const [x, z] = ringSpot(terrain, occ, st.position, n * 1.9 + 0.6, v.offsetFromRail + v.lotSpacing * 4)
    occ.take(x, z, 9)
    landmarks.push({ landmark: lm, stationId: st.id, regionId: st.regionId, position: [x, terrain.height(x, z), z], rotation: Math.atan2(st.position[0] - x, st.position[2] - z) })
  }
  const guides = src.world.guides.flatMap((g) => {
    const at = landmarks.find((l) => l.landmark.id === g.landmark)
    if (!at) return []
    const x = at.position[0] + Math.sin(at.rotation) * 8
    const z = at.position[2] + Math.cos(at.rotation) * 8
    return [{ guide: g, position: [x, terrain.height(x, z), z] as Pos, rotation: at.rotation }]
  })
  return { landmarks, guides }
}

/** Weighted pick from a species list. */
function pickSpecies(list: readonly { kind: string; weight: number }[], r: number): string {
  const total = list.reduce((a, s) => a + s.weight, 0)
  let acc = 0
  for (const s of list) {
    acc += s.weight / total
    if (r <= acc) return s.kind
  }
  return list[list.length - 1]!.kind
}

function scatter(src: LayoutSource, terrain: Terrain, occ: Occupancy, count: number, seed: number, fixed: string | null): Scatter[] {
  const m = src.world.map
  const rand = mulberry32(seed)
  const half = m.size / 2
  const out: Scatter[] = []
  for (let tries = 0; out.length < count && tries < count * 6; tries++) {
    const x = (rand() * 2 - 1) * half * 0.97
    const z = (rand() * 2 - 1) * half * 0.97
    const h = terrain.height(x, z)
    if ((fixed !== 'rock' && h > m.snowline - 6) || terrain.isWet(x, z) || terrain.slope(x, z) > m.vegetation.maxSlope) continue
    if (!occ.free(x, z, 3) || terrain.rail.nearest(x, z).distance < m.rail.width * 2.5) continue
    const w = terrain.regionWeights(x, z)
    const region = m.regions[w.indexOf(Math.max(...w))]!
    const nearCoast = z > terrain.coastZ(x) - m.coast.beach * 3
    const sp = m.vegetation.species
    const kind = fixed ?? pickSpecies(region.biome === 'highland' ? sp.highland : nearCoast ? sp.coast : sp.lowland, rand())
    if (fixed === null) occ.take(x, z, 2)
    out.push({ kind, position: [x, h, z], scale: 0.75 + rand() * 0.7, rotation: rand() * Math.PI * 2 })
  }
  return out
}

export function buildWorldLayout(src: LayoutSource, terrain: Terrain): WorldLayout {
  const occ = new Occupancy(4)
  const stations = placeStations(src, terrain)
  for (const s of stations) occ.take(s.position[0], s.position[2], 8)
  const features = src.world.map.features.map((f) => {
    occ.take(f.at[0], f.at[1], 8)
    return { id: f.id, kind: f.kind, name: f.name, position: [f.at[0], terrain.height(f.at[0], f.at[1]), f.at[1]] as Pos }
  })
  const lots = placeLots(src, terrain, stations, occ)
  const { landmarks, guides } = placeLandmarks(src, terrain, stations, occ)
  const veg = src.world.map.vegetation
  const waypoints: Record<string, Pos[]> = {}
  for (const r of src.world.map.regions) {
    waypoints[r.id] = [
      ...stations.filter((s) => s.regionId === r.id).map((s) => s.position),
      ...landmarks.filter((l) => l.regionId === r.id).map((l) => l.position),
      ...lots.filter((l) => l.regionId === r.id).map((l) => l.house),
    ]
  }
  return {
    stations, lots, landmarks, guides, features, waypoints,
    trees: scatter(src, terrain, occ, veg.trees, src.world.map.seed + 1, null),
    shrubs: [...scatter(src, terrain, occ, veg.shrubs, src.world.map.seed + 2, 'shrub'), ...scatter(src, terrain, occ, veg.rocks, src.world.map.seed + 3, 'rock')],
  }
}
