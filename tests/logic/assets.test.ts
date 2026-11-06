import { describe, expect, it } from 'vitest'
import { buildCatalog } from '@/lib/content/catalog'
import { loadContent } from '@/lib/content/load'
import { modelReader } from '@/lib/content/model-reader'
import { validateContent } from '@/lib/content/validate'
import { VALIDATE_OPTIONS } from '@/lib/registry/validate-options'
import { readGlbSummary } from '@/lib/world/glb'
import { buildWorldLayout } from '@/lib/world/layout'
import { createTerrain } from '@/lib/world/terrain'
import { wildlifeHomes } from '@/lib/world/wildlife'

const bundle = loadContent()
const catalog = buildCatalog(bundle)

function glb(json: object): Uint8Array {
  const text = new TextEncoder().encode(JSON.stringify(json))
  const pad = (4 - (text.length % 4)) % 4
  const body = new Uint8Array(text.length + pad).fill(0x20)
  body.set(text)
  const out = new Uint8Array(20 + body.length)
  const v = new DataView(out.buffer)
  v.setUint32(0, 0x46546c67, true)
  v.setUint32(4, 2, true)
  v.setUint32(8, out.length, true)
  v.setUint32(12, body.length, true)
  v.setUint32(16, 0x4e4f534a, true)
  out.set(body, 20)
  return out
}

describe('glb summary', () => {
  it('lists clips and materials from the JSON chunk', () => {
    expect(readGlbSummary(glb({ animations: [{ name: 'walk' }], materials: [{ name: 'leafsGreen' }] }))).toEqual({ clips: ['walk'], materials: ['leafsGreen'] })
  })
  it('rejects data that is not a glb', () => {
    expect(readGlbSummary(new Uint8Array(40))).toBeNull()
  })
})

describe('model assets', () => {
  it('every declared model file exists with the clips and materials the data names', () => {
    const issues = validateContent(bundle, { ...VALIDATE_OPTIONS, readModel: modelReader() }).filter((i) => i.where.startsWith('model:') || i.where.startsWith('assets'))
    expect(issues).toEqual([])
  })
  it('reports a clip that the file does not have', () => {
    const broken = structuredClone(bundle)
    broken.world.assets.models[0]!.clips = { ...broken.world.assets.models[0]!.clips, walk: 'moonwalk' }
    const issues = validateContent(broken, { ...VALIDATE_OPTIONS, readModel: modelReader() })
    expect(issues.some((i) => i.message.includes('moonwalk'))).toBe(true)
  })
  it('reports a role whose model lacks a needed action', () => {
    const broken = structuredClone(bundle)
    broken.world.assets.cast.companion = broken.world.assets.cast.bus
    expect(validateContent(broken, VALIDATE_OPTIONS).some((i) => i.where === 'assets:companion')).toBe(true)
  })
})

describe('wildlife', () => {
  it('homes animals in forests of their biome, away from houses', () => {
    const terrain = createTerrain(catalog.world.map)
    const layout = buildWorldLayout(catalog, terrain)
    const herds = catalog.world.assets.cast.wildlife
    const animals = wildlifeHomes(layout, terrain, catalog.world.map, herds)
    expect(animals.length).toBe(herds.reduce((a, h) => a + h.count, 0))
    for (const a of animals) for (const l of layout.lots) expect(Math.hypot(l.house[0] - a.home[0], l.house[2] - a.home[2])).toBeGreaterThan(30)
  })
})
