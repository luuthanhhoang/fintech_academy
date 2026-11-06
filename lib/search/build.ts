/** Builds search documents from the content bundle (build time). */
import type { ContentBundle } from '../content/types'
import { lessonSections } from '../content/sections'
import type { SearchDoc } from './options'

/** Drop LaTeX from search text so excerpts read as prose. */
const stripMath = (t: string) => t.replace(/\$\$[\s\S]*?\$\$/g, ' ').replace(/\$[^$\n]*\$/g, ' ').replace(/\s+/g, ' ').trim()

export function buildSearchDocs(b: ContentBundle): SearchDoc[] {
  const conceptName = new Map(b.concepts.map((c) => [c.id, c.name.vi]))
  const docs: SearchDoc[] = []
  for (const l of b.lessons) {
    const tags = l.concepts.map((c) => conceptName.get(c) ?? c).join(' ')
    docs.push({
      id: `lesson:${l.id}`,
      kind: 'lesson',
      title: l.title.vi,
      titleEn: l.title.en,
      text: `${l.summary} ${l.whyQuestion}`,
      tags,
      href: `/lessons/${l.id}/`,
    })
    for (const s of lessonSections(l.body)) {
      if (!s.slug) continue
      docs.push({
        id: `section:${l.id}#${s.slug}`,
        kind: 'section',
        title: s.heading,
        titleEn: l.title.vi,
        text: stripMath(s.text),
        tags,
        href: `/lessons/${l.id}/#${s.slug}`,
      })
    }
  }
  for (const l of b.lessons) {
    for (const ex of l.examples) {
      docs.push({ id: `example:${ex.id}`, kind: 'example', title: ex.title, titleEn: l.title.vi, text: stripMath([ex.problem, ...ex.steps.map((s) => s.text), ex.takeaway].join(' ')), tags: '', href: `/lessons/${l.id}/` })
    }
  }
  for (const s of b.scenarios) {
    docs.push({ id: `scenario:${s.id}`, kind: 'scenario', title: s.title.vi, titleEn: s.title.en, text: `${s.summary} ${s.role}`, tags: '', href: `/scenarios/${s.id}/` })
  }
  for (const m of b.config.methods.methods) {
    docs.push({ id: `method:${m.id}`, kind: 'method', title: m.name.vi, titleEn: m.name.en, text: `${m.summary} ${m.evidence}`, tags: '', href: `/method/#${m.id}` })
  }
  for (const c of b.concepts) {
    docs.push({ id: `concept:${c.id}`, kind: 'concept', title: c.name.vi, titleEn: c.name.en, text: c.short, tags: c.tags.join(' '), href: `/concepts/${c.id}/` })
  }
  for (const s of b.simulators) {
    docs.push({ id: `simulator:${s.id}`, kind: 'simulator', title: s.title.vi, titleEn: s.title.en, text: `${s.summary} ${s.howToRead}`, tags: '', href: `/simulators/${s.id}/` })
  }
  for (const x of b.labs) {
    docs.push({ id: `lab:${x.id}`, kind: 'lab', title: x.title.vi, titleEn: x.title.en, text: `${x.summary} ${x.instructions}`, tags: '', href: `/labs/${x.id}/` })
  }
  for (const c of b.cases) {
    docs.push({
      id: `case:${c.id}`,
      kind: 'case',
      title: c.title.vi,
      titleEn: c.title.en,
      text: `${c.summary} ${c.timeline.map((e) => e.event).join(' ')}`,
      tags: c.period,
      href: `/cases/${c.id}/`,
    })
  }
  // Tracks and their stations: the English names make "backend" or "fintech" find the right line and station.
  for (const t of b.tracks) {
    docs.push({ id: `track:${t.id}`, kind: 'track', title: t.title.vi, titleEn: t.title.en, text: t.summary, tags: t.colorName, href: `/tracks/${t.id}/` })
    for (const st of t.stages) {
      docs.push({ id: `stage:${st.id}`, kind: 'stage', title: `Ga ${st.id.toUpperCase()} · ${st.title.vi}`, titleEn: st.title.en, text: st.summary, tags: t.title.vi, href: `/tracks/${t.id}/#${st.id}` })
    }
  }
  for (const p of b.planned) {
    docs.push({
      id: `planned:${p.id}`,
      kind: 'planned',
      title: p.title.vi,
      titleEn: p.title.en,
      text: p.concepts.map((c) => conceptName.get(c) ?? c).join(', '),
      tags: '',
      href: `/tracks/${p.track}/#${p.stage}`,
    })
  }
  return docs
}
