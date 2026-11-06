/** Where wild animals live (pure): home spots at forest trees of the right biome, spread over the map. */
import type { AssetsFile } from '../content/schema/assets'
import type { WorldMap } from '../content/schema/world'
import { mulberry32 } from '../finance/random'
import type { Pos, WorldLayout } from './layout'
import type { Terrain } from './terrain'

export interface Animal { model: string; home: Pos; seed: number }

/** Animals keep at least this far from houses (they are wild) when picking a home tree. */
const SHY_OF_HOUSES = 40

export function wildlifeHomes(layout: WorldLayout, terrain: Terrain, map: WorldMap, herds: AssetsFile['cast']['wildlife']): Animal[] {
  const rand = mulberry32(map.seed + 83)
  const biomeAt = (x: number, z: number) => {
    const w = terrain.regionWeights(x, z)
    return map.regions[w.indexOf(Math.max(...w))]!.biome
  }
  const houses = layout.lots.map((l) => l.house)
  const wild = layout.trees.filter((t) => houses.every((h) => Math.hypot(h[0] - t.position[0], h[2] - t.position[2]) > SHY_OF_HOUSES))
  const out: Animal[] = []
  for (const herd of herds) {
    const pool = wild.filter((t) => biomeAt(t.position[0], t.position[2]) === herd.biome)
    for (let i = 0; i < herd.count && pool.length; i++) {
      const t = pool[Math.floor(rand() * pool.length)]!
      const x = t.position[0] + (rand() - 0.5) * 8
      const z = t.position[2] + (rand() - 0.5) * 8
      out.push({ model: herd.model, home: [x, terrain.height(x, z), z], seed: rand() * 100 })
    }
  }
  return out
}
