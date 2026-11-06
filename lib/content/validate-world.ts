/** Validation of the learning village: map geometry, landmark coverage, guides, views, weather, music, focus. */
import type { ContentBundle } from './types'
import type { ValidateOptions } from './validate'

type Push = (where: string, message: string) => void
const HEX = /^#[0-9a-f]{6}$/i

function dupes(push: Push, kind: string, ids: readonly string[]) {
  const seen = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) push(`${kind}:${id}`, 'id bị trùng')
    seen.add(id)
  }
}

function checkMap(b: ContentBundle, push: Push) {
  const m = b.world.map
  const half = m.size / 2
  const inside = (where: string, [x, z]: readonly [number, number]) => {
    if (Math.abs(x) > half || Math.abs(z) > half) push(where, `toạ độ [${x}, ${z}] nằm ngoài bản đồ ±${half}`)
  }
  const tracks = new Set(b.tracks.map((t) => t.id))
  for (const t of b.tracks) {
    const n = m.regions.filter((r) => r.track === t.id).length
    if (n !== 1) push(`world:track:${t.id}`, `mỗi lộ trình cần đúng một vùng đất (đang có ${n})`)
  }
  const spans = m.regions.map((r) => r.railSpan).sort((a, b) => a[0] - b[0])
  spans.forEach((s, i) => {
    if (s[0] >= s[1]) push('world:regions', `railSpan [${s.join(', ')}] phải tăng dần`)
    const next = spans[i + 1]
    if (next && next[0] < s[1]) push('world:regions', 'các railSpan của vùng không được chồng nhau')
  })
  for (const r of m.regions) {
    if (!tracks.has(r.track)) push(`world:region:${r.id}`, `track "${r.track}" không tồn tại`)
    inside(`world:region:${r.id}`, r.center)
    for (const c of [r.palette.ground, ...r.palette.roof, ...r.palette.wall]) if (!HEX.test(c)) push(`world:region:${r.id}`, `màu "${c}" phải dạng #rrggbb`)
  }
  for (const p of m.peaks) inside(`world:peak:${p.id}`, p.at)
  for (const l of m.lakes) inside(`world:lake:${l.id}`, l.center)
  for (const f of m.features) inside(`world:feature:${f.id}`, f.at)
  for (const r of m.rivers) r.points.forEach((p) => inside(`world:river:${r.id}`, p))
  for (const p of m.rail.points) {
    inside('world:rail', p)
    if (p[1] > m.coast.z - m.coast.beach) push('world:rail', `điểm ray [${p.join(', ')}] nằm dưới biển hoặc bãi cát`)
  }
  for (const c of [...m.people.skin, ...m.people.clothes, ...m.people.hair]) if (!HEX.test(c)) push('world:people', `màu "${c}" phải dạng #rrggbb`)
  dupes(push, 'world', [...m.regions.map((r) => r.id), ...m.peaks.map((p) => p.id), ...m.lakes.map((l) => l.id), ...m.rivers.map((r) => r.id), ...m.features.map((f) => f.id)])
}

function checkLandmarks(b: ContentBundle, opts: ValidateOptions, push: Push) {
  const w = b.world
  dupes(push, 'landmark', w.landmarks.map((l) => l.id))
  const lessonRefs = {
    simulator: new Set(b.lessons.flatMap((l) => l.simulators)),
    lab: new Set(b.lessons.flatMap((l) => l.labs)),
    case: new Set(b.lessons.flatMap((l) => l.cases)),
    scenario: new Set(b.lessons.flatMap((l) => l.scenarios)),
  }
  const targets = {
    simulator: b.simulators.map((s) => s.id),
    lab: b.labs.map((x) => x.id),
    case: b.cases.map((x) => x.id),
    scenario: b.scenarios.map((x) => x.id),
  }
  for (const l of w.landmarks) {
    const where = `landmark:${l.id}`
    if (!opts.worldModelKeys.includes(l.model)) push(where, `model "${l.model}" chưa có trong WORLD_MODEL_KEYS`)
    if (!targets[l.ref.kind].includes(l.ref.id)) push(where, `${l.ref.kind} "${l.ref.id}" không tồn tại`)
    else if (!lessonRefs[l.ref.kind].has(l.ref.id)) push(where, `${l.ref.kind} "${l.ref.id}" chưa bài nào dùng nên không đặt được cạnh ga`)
  }
  for (const kind of ['simulator', 'lab', 'case', 'scenario'] as const) {
    for (const id of targets[kind]) {
      const n = w.landmarks.filter((l) => l.ref.kind === kind && l.ref.id === id).length
      if (n !== 1) push(`${kind}:${id}`, `cần đúng một công trình trong làng (đang có ${n})`)
    }
  }
  const marks = new Set(w.landmarks.map((l) => l.id))
  const modes = new Set(b.config.tutor.modes.map((m) => m.id))
  dupes(push, 'guide', w.guides.map((g) => g.id))
  for (const g of w.guides) {
    if (!marks.has(g.landmark)) push(`guide:${g.id}`, `công trình "${g.landmark}" không tồn tại`)
    if (!modes.has(g.tutorMode)) push(`guide:${g.id}`, `chế độ gia sư "${g.tutorMode}" không có trong tutor.yaml`)
  }
}

function checkAtmosphere(b: ContentBundle, opts: ValidateOptions, push: Push) {
  const w = b.world
  const m = w.map
  const weather = new Set(w.weather.presets.map((p) => p.id))
  const anchorIds = {
    feature: new Set(m.features.map((f) => f.id)),
    lake: new Set(m.lakes.map((l) => l.id)),
    peak: new Set(m.peaks.map((p) => p.id)),
    landmark: new Set(w.landmarks.map((l) => l.id)),
  }
  dupes(push, 'view', w.views.map((v) => v.id))
  dupes(push, 'weather', w.weather.presets.map((p) => p.id))
  dupes(push, 'music', w.music.pieces.map((p) => p.id))
  if (!w.views.some((v) => v.id === w.defaultView)) push('world:views', `defaultView "${w.defaultView}" không tồn tại`)
  for (const v of w.views) {
    const where = `view:${v.id}`
    const a = v.anchor
    if ('id' in a && !anchorIds[a.kind].has(a.id)) push(where, `${a.kind} "${a.id}" không tồn tại`)
    if ((v.mode === 'walk') !== (a.kind === 'frontier')) push(where, 'chế độ walk đi cùng anchor frontier (và ngược lại)')
    if (v.weather && !weather.has(v.weather)) push(where, `thời tiết "${v.weather}" không tồn tại`)
    for (const s of v.ambience) if (!opts.ambienceKeys.includes(s)) push(where, `âm thanh "${s}" chưa có trong AMBIENCE_KEYS`)
  }
  const p = w.map.player
  if (p.camera.minDistance >= p.camera.maxDistance) push('world:player', 'camera.minDistance phải nhỏ hơn maxDistance')
  if (p.walkSpeed >= p.runSpeed) push('world:player', 'runSpeed phải lớn hơn walkSpeed')
  for (const [k, line] of Object.entries(w.map.people.chatter)) if (!line.includes('{concept}')) push(`world:chatter.${k}`, 'câu thoại phải có {concept}')
  for (const k of ['school', 'busStop'] as const) if (!w.map.civic[k].includes('{region}')) push(`world:civic.${k}`, 'phải có {region}')
  for (const id of [w.weather.defaultWeather, w.weather.celebration, w.weather.scenario]) if (!weather.has(id)) push('world:weather', `preset "${id}" không tồn tại`)
  for (const p of w.weather.presets) for (const s of p.ambience) if (!opts.ambienceKeys.includes(s)) push(`weather:${p.id}`, `âm thanh "${s}" chưa có trong AMBIENCE_KEYS`)
  for (const p of w.music.pieces) {
    for (const l of p.layers) if (!opts.musicLayerKeys.includes(l)) push(`music:${p.id}`, `nhạc cụ "${l}" chưa có trong MUSIC_LAYER_KEYS`)
    for (const d of p.progression) if (d >= p.scale.length) push(`music:${p.id}`, `bậc hợp âm ${d} vượt số nốt của thang âm`)
    if (new Set(p.scale).size !== p.scale.length || p.scale[0] !== 0) push(`music:${p.id}`, 'thang âm phải bắt đầu từ 0 và không trùng nốt')
  }
}

function checkFocus(b: ContentBundle, push: Push) {
  const f = b.config.focus
  const views = new Map(b.world.views.map((v) => [v.id, v]))
  const blocks = new Set(b.config.today.blocks.map((x) => x.id))
  dupes(push, 'journey', f.journeys.map((j) => j.id))
  for (const j of f.journeys) {
    const v = views.get(j.view)
    if (!v) push(`journey:${j.id}`, `góc ngắm "${j.view}" không tồn tại`)
    else if (v.mode !== 'focus') push(`journey:${j.id}`, `góc ngắm "${j.view}" không phải chế độ focus`)
  }
  for (const s of f.taskSources) if (!blocks.has(s)) push('focus:taskSources', `khối "${s}" không có trong today.yaml`)
  const focusViews = b.world.views.filter((v) => v.mode === 'focus')
  for (const v of focusViews) if (!f.journeys.some((j) => j.view === v.id)) push(`view:${v.id}`, 'góc ngắm focus chưa hành trình nào dùng')
}

function checkGraphics(b: ContentBundle, opts: ValidateOptions, push: Push) {
  const g = b.world.graphics
  const ids = new Set(g.quality.map((q) => q.id))
  dupes(push, 'quality', g.quality.map((q) => q.id))
  for (const id of [g.defaultQuality, g.lightQuality]) if (!ids.has(id)) push('world:graphics', `mức chất lượng "${id}" không tồn tại`)
  const looks = new Set(g.looks.map((l) => l.id))
  if (looks.size !== g.looks.length) push('world:graphics', 'mỗi look (night/dawn/day/dusk) chỉ khai báo một lần')
  for (const l of g.looks) if (!opts.hdriKeys.includes(l.hdri)) push(`look:${l.id}`, `hdri "${l.hdri}" chưa có trong HDRI_KEYS`)
  for (const q of g.quality) if (q.dpr[0] > q.dpr[1]) push(`quality:${q.id}`, 'dpr phải [min, max]')
  const v = b.world.map.vegetation
  for (const k of [...v.species.lowland, ...v.species.highland, ...v.species.coast].map((x) => x.kind)) {
    if (!opts.treeKinds.includes(k)) push('world:vegetation', `loài "${k}" chưa có trong TREE_KINDS`)
  }
  for (const k of opts.treeKinds) if (!v.leaves[k]) push('world:vegetation', `thiếu màu lá cho "${k}"`)
  for (const k of Object.keys(v.leaves)) if (!opts.treeKinds.includes(k)) push('world:vegetation', `màu lá cho loài lạ "${k}"`)
}

export function validateWorld(b: ContentBundle, opts: ValidateOptions, push: Push) {
  checkGraphics(b, opts, push)
  checkMap(b, push)
  checkLandmarks(b, opts, push)
  checkAtmosphere(b, opts, push)
  checkFocus(b, push)
}
