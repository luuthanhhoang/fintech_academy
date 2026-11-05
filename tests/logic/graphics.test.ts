import { describe, expect, it } from 'vitest'
import { buildCatalog } from '@/lib/content/catalog'
import { loadContent } from '@/lib/content/load'
import { grassMask } from '@/lib/world/grass'
import { sampleGrid } from '@/lib/world/grid'
import { buildWorldLayout } from '@/lib/world/layout'
import { blendLook } from '@/lib/world/looks'
import { pathSegments, rasterisePaths } from '@/lib/world/paths'
import { createTerrain } from '@/lib/world/terrain'
import { plaster, roofTiles } from '@/lib/world/texture-data'

const catalog = buildCatalog(loadContent())
const looks = catalog.world.graphics.looks
const terrain = createTerrain(catalog.world.map)
const layout = buildWorldLayout(catalog, terrain)
const grid = sampleGrid(terrain)
const deg = (d: number) => (d * Math.PI) / 180

describe('art-direction looks', () => {
  it('uses the pure look at its band and blends in between', () => {
    expect(blendLook(looks, deg(40), 12).dominant.id).toBe('day')
    expect(blendLook(looks, deg(-30), 23).dominant.id).toBe('night')
    expect(blendLook(looks, deg(1), 6).dominant.id).toBe('dawn')
    expect(blendLook(looks, deg(1), 18).dominant.id).toBe('dusk')
    const day = looks.find((l) => l.id === 'day')!
    expect(blendLook(looks, deg(40), 12).sunIntensity).toBeCloseTo(day.sunIntensity)
    const mid = blendLook(looks, deg(10), 17).sunIntensity
    expect(mid).toBeLessThan(day.sunIntensity)
  })
})

describe('height grid', () => {
  it('matches the terrain at grid vertices and interpolates between', () => {
    const step = grid.size / (grid.n - 1)
    const x = -grid.size / 2 + 40 * step
    const z = -grid.size / 2 + 60 * step
    expect(grid.at(x, z)).toBeCloseTo(terrain.height(x, z), 3)
    expect(Math.abs(grid.at(x + step / 2, z) - terrain.height(x + step / 2, z))).toBeLessThan(2)
  })
})

describe('footpaths', () => {
  it('connect every house and landmark into a tree per station', () => {
    const segs = pathSegments(layout)
    expect(segs.length).toBe(layout.lots.length + layout.landmarks.length)
    const mask = rasterisePaths(segs, catalog.world.map.size, 256, 2)
    const s = segs[0]!
    const i = Math.floor(((s[0] + s[2]) / 2 / catalog.world.map.size + 0.5) * 256)
    const j = Math.floor(((s[1] + s[3]) / 2 / catalog.world.map.size + 0.5) * 256)
    expect(mask[j * 256 + i]).toBeGreaterThan(0)
  })
})

describe('grass mask', () => {
  it('keeps grass out of the sea, lakes and houses', () => {
    const res = 128
    const mask = grassMask(terrain, grid, layout, res)
    const cell = (x: number, z: number) => mask[Math.floor((z / catalog.world.map.size + 0.5) * res) * res + Math.floor((x / catalog.world.map.size + 0.5) * res)]
    const lake = terrain.lakes[0]!
    expect(cell(lake.center[0], lake.center[1])).toBe(0)
    expect(cell(0, catalog.world.map.size / 2 - 5)).toBe(0)
    expect(cell(layout.lots[0]!.house[0], layout.lots[0]!.house[2])).toBe(0)
    expect(mask.some((v) => v > 0)).toBe(true)
  })
})

describe('procedural textures', () => {
  it('produce opaque RGBA pixels with visible variation', () => {
    for (const t of [plaster(64, 1), roofTiles(64, 2)]) {
      expect(t.data.length).toBe(64 * 64 * 4)
      let min = 255
      let max = 0
      for (let i = 0; i < t.data.length; i += 4) {
        min = Math.min(min, t.data[i]!)
        max = Math.max(max, t.data[i]!)
        expect(t.data[i + 3]).toBe(255)
      }
      expect(max - min).toBeGreaterThan(10)
    }
  })
})
