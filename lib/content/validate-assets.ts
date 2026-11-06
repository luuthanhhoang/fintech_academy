/** Checks content/world/assets.yaml: references between models and their uses, and (when a reader is given) the files. */
import type { ContentBundle } from './types'
import type { ValidateOptions } from './validate'
import type { Action } from './schema/assets'

type Push = (where: string, message: string) => void

/** Actions each role must be able to play. */
const NEEDS: Record<string, Action[]> = {
  player: ['idle', 'walk', 'run'],
  villagers: ['idle', 'walk'],
  kids: ['idle', 'walk', 'run'],
  guides: ['idle', 'wave'],
  companion: ['idle', 'walk', 'run', 'sit'],
  wildlife: ['idle', 'walk', 'run', 'eat'],
}

export function validateAssets(b: ContentBundle, opts: ValidateOptions, push: Push) {
  const a = b.world.assets
  const models = new Map(a.models.map((m) => [m.id, m]))
  if (models.size !== a.models.length) push('world:assets', 'id mô hình bị trùng')
  const needs = (where: string, id: string, actions: Action[] = []) => {
    const m = models.get(id)
    if (!m) return push(where, `mô hình "${id}" không tồn tại`)
    for (const act of actions) if (!m.clips?.[act]) push(where, `mô hình "${id}" thiếu hoạt ảnh "${act}"`)
  }
  const c = a.cast
  needs('assets:player', c.player, NEEDS.player)
  for (const id of c.villagers) needs('assets:villagers', id, NEEDS.villagers)
  for (const id of c.kids) needs('assets:kids', id, NEEDS.kids)
  for (const id of c.guides) needs('assets:guides', id, NEEDS.guides)
  needs('assets:companion', c.companion, NEEDS.companion)
  for (const w of c.wildlife) needs('assets:wildlife', w.model, NEEDS.wildlife)
  for (const id of [c.bus, ...c.traffic, c.tractor, c.fence, ...c.stationGoods, ...c.camp.models, ...c.town.models]) needs('assets:cast', id)
  if (!b.world.map.regions.some((r) => r.id === c.town.region)) push('assets:town', `vùng "${c.town.region}" không tồn tại`)
  if (!b.world.map.features.some((f) => f.id === c.camp.feature && f.kind === 'camp')) push('assets:camp', `"${c.camp.feature}" phải là feature kiểu camp trong map.yaml`)
  for (const [kind, ids] of Object.entries(a.vegetation)) {
    if (!opts.treeKinds.includes(kind)) push('assets:vegetation', `loài "${kind}" chưa có trong TREE_KINDS`)
    for (const id of ids) needs(`assets:vegetation.${kind}`, id)
  }
  // Every declared model must be used somewhere (no orphan files).
  const used = new Set([c.player, ...c.villagers, ...c.kids, ...c.guides, c.companion, ...c.wildlife.map((w) => w.model), c.bus, ...c.traffic, c.tractor, c.fence, ...c.stationGoods, ...c.camp.models, ...c.town.models, ...Object.values(a.vegetation).flat()])
  for (const m of a.models) if (!used.has(m.id)) push(`model:${m.id}`, 'mô hình không được dùng ở đâu')
  if (!opts.readModel) return
  for (const m of a.models) {
    const s = opts.readModel(m.file)
    if (!s) {
      push(`model:${m.id}`, `không đọc được public/models/${m.file} (thiếu file hoặc không phải .glb)`)
      continue
    }
    for (const [act, clip] of Object.entries(m.clips ?? {})) if (!s.clips.includes(clip)) push(`model:${m.id}`, `không có clip "${clip}" (cho ${act}) trong ${m.file}`)
    for (const p of m.paint) if (!s.materials.includes(p)) push(`model:${m.id}`, `không có vật liệu "${p}" trong ${m.file}`)
  }
}
