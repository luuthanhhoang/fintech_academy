/** Builds search documents from the content bundle (build time). */
import type { ContentBundle } from '../content/types'
import { lessonSections } from '../content/sections'
import type { SearchDoc } from './options'

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
        text: s.text,
        tags,
        href: `/lessons/${l.id}/#${s.slug}`,
      })
    }
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
