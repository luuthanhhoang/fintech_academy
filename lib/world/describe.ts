/** Turns a selected place into panel content: what it is, why it stands there, where it leads on the site. */
import type { Catalog } from '../content/catalog'
import type { PlotHealth } from './health'
import type { Pos, WorldLayout } from './layout'
import type { Terrain } from './terrain'

export interface PlaceLink { label: string; href: string }

export interface PlaceInfo {
  kind: string
  title: string
  subtitle: string
  body: string[]
  links: PlaceLink[]
  at: Pos
  health?: PlotHealth
  /** Scenario landmarks switch the weather to a storm while selected. */
  scenario?: boolean
}

const refHref = { simulator: '/simulators/', lab: '/labs/', case: '/cases/', scenario: '/scenarios/' } as const
const refLabel = { simulator: 'Mở mô phỏng', lab: 'Mở code lab', case: 'Đọc case study', scenario: 'Vào tình huống' } as const

function refTitle(catalog: Catalog, kind: keyof typeof refHref, id: string): string {
  const list = { simulator: catalog.simulators, lab: catalog.labs, case: catalog.cases, scenario: catalog.scenarios }[kind]
  return list.find((x) => x.id === id)?.title.vi ?? id
}

export function describePlace(sel: { kind: string; id: string }, catalog: Catalog, layout: WorldLayout, terrain: Terrain, health: ReadonlyMap<string, PlotHealth>): PlaceInfo | null {
  switch (sel.kind) {
    case 'station': {
      const s = layout.stations.find((x) => x.id === sel.id)
      const stage = catalog.tracks.flatMap((t) => t.stages.map((st) => ({ ...st, track: t }))).find((st) => st.id === sel.id)
      if (!s || !stage) return null
      const lessons = catalog.lessons.filter((l) => l.stage === s.id).sort((a, b) => a.order - b.order)
      const lots = layout.lots.filter((l) => l.stageId === s.id)
      const lit = lots.filter((l) => health.get(l.conceptId)?.lit).length
      return {
        kind: 'Ga tàu', title: `Ga ${s.id.toUpperCase()} · ${stage.title.vi}`, subtitle: stage.track.title.vi, at: s.position,
        body: [stage.summary, `${lots.length} ngôi nhà (khái niệm) quanh ga; ${lit} nhà đã sáng đèn (thành thạo).`, lessons.length ? '' : 'Chặng này chưa có bài viết — các lô đất còn để trống.'].filter(Boolean),
        links: [{ label: 'Xem chặng trên lộ trình', href: `/tracks/${stage.track.id}/#${s.id}` }, ...lessons.map((l) => ({ label: l.title.vi, href: `/lessons/${l.id}/` }))],
      }
    }
    case 'lot': {
      const lot = layout.lots.find((l) => l.conceptId === sel.id)
      const c = catalog.concepts.find((x) => x.id === sel.id)
      if (!lot || !c) return null
      const lessons = catalog.lessons.filter((l) => l.concepts.includes(c.id))
      return {
        kind: lot.plotKind === 'paddy' ? 'Nhà & ruộng lúa' : 'Nhà & đồi chè', title: c.name.vi, subtitle: c.name.en, at: lot.house, health: health.get(c.id),
        body: [c.short],
        links: [{ label: 'Trang khái niệm', href: `/concepts/${c.id}/` }, ...lessons.map((l) => ({ label: `Bài: ${l.title.vi}`, href: `/lessons/${l.id}/` })), { label: 'Ôn thẻ đến hạn', href: '/review/' }],
      }
    }
    case 'landmark': {
      const p = layout.landmarks.find((l) => l.landmark.id === sel.id)
      if (!p) return null
      const { ref } = p.landmark
      const guides = layout.guides.filter((g) => g.guide.landmark === p.landmark.id)
      return {
        kind: 'Công trình', title: p.landmark.title, subtitle: refTitle(catalog, ref.kind, ref.id), at: p.position, scenario: ref.kind === 'scenario',
        body: [p.landmark.metaphor, ...guides.map((g) => `${g.guide.name} (${g.guide.role}) đứng gần đây.`)],
        links: [{ label: refLabel[ref.kind], href: `${refHref[ref.kind]}${ref.id}/` }],
      }
    }
    case 'guide': {
      const g = layout.guides.find((x) => x.guide.id === sel.id)
      const mode = catalog.config.tutor.modes.find((m) => m.id === g?.guide.tutorMode)
      if (!g || !mode) return null
      return {
        kind: 'Người dẫn đường', title: g.guide.name, subtitle: g.guide.role, at: g.position,
        body: [`“${g.guide.greeting}”`, `Chế độ gia sư: ${mode.label} — ${mode.description}`],
        links: [{ label: `Trò chuyện (${mode.label})`, href: `/tutor/?mode=${mode.id}` }],
      }
    }
    case 'feature': {
      const f = layout.features.find((x) => x.id === sel.id)
      if (!f) return null
      const views = catalog.world.views.filter((v) => v.anchor.kind === 'feature' && v.anchor.id === f.id)
      return { kind: 'Cảnh quan', title: f.name, subtitle: views.map((v) => v.title).join(' · '), at: f.position, body: views.map((v) => v.description), links: [] }
    }
    case 'lake': {
      const l = terrain.lakes.find((x) => x.id === sel.id)
      return l ? { kind: l.kind === 'pond' ? 'Ao' : 'Hồ', title: l.name, subtitle: '', at: [l.center[0], l.surface, l.center[1]], body: [], links: [] } : null
    }
    default:
      return null
  }
}
