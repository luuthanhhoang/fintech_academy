/** Retrieval units for the tutor. Every chunk has a stable id used as a citation key. */
import type { ContentBundle } from '../content/types'
import { lessonSections } from '../content/sections'

export interface TutorChunk {
  id: string
  title: string
  source: string
  href: string
  conceptIds: string[]
  text: string
}

export function buildTutorChunks(b: ContentBundle): TutorChunk[] {
  const chunks: TutorChunk[] = []
  for (const l of b.lessons) {
    for (const s of lessonSections(l.body)) {
      const anchor = s.slug || 'mo-dau'
      chunks.push({
        id: `${l.id}#${anchor}`,
        title: s.heading || l.title.vi,
        source: l.title.vi,
        href: `/lessons/${l.id}/${s.slug ? `#${s.slug}` : ''}`,
        conceptIds: l.concepts,
        text: s.text,
      })
    }
    l.devMapping.forEach((d, i) => {
      chunks.push({
        id: `${l.id}#dev-${i + 1}`,
        title: `${d.finance} ≈ ${d.dev}`,
        source: l.title.vi,
        href: `/lessons/${l.id}/#anh-xa-dev`,
        conceptIds: l.concepts,
        text: d.explanation,
      })
    })
  }
  for (const l of b.lessons) {
    for (const ex of l.examples) {
      chunks.push({ id: `${l.id}#vd-${ex.id}`, title: `Ví dụ: ${ex.title}`, source: l.title.vi, href: `/lessons/${l.id}/`, conceptIds: [ex.conceptId], text: [ex.problem, ...ex.steps.map((s) => s.text), ex.takeaway].join('\n') })
    }
  }
  for (const s of b.scenarios) {
    const endings = s.nodes.filter((n) => n.ending).map((n) => n.ending?.debrief ?? '')
    chunks.push({ id: `scenario:${s.id}`, title: `Tình huống giả định: ${s.title.vi}`, source: 'Tình huống', href: `/scenarios/${s.id}/`, conceptIds: s.concepts, text: [s.summary, ...endings].join('\n') })
  }
  for (const c of b.concepts) {
    chunks.push({ id: `concept:${c.id}`, title: `${c.name.vi} (${c.name.en})`, source: 'Khái niệm', href: `/concepts/${c.id}/`, conceptIds: [c.id], text: c.short })
  }
  for (const cs of b.cases) {
    const verified = cs.timeline.filter((e) => e.status === 'verified').map((e) => `${e.date}: ${e.event}`)
    chunks.push({
      id: `case:${cs.id}`,
      title: cs.title.vi,
      source: 'Case study',
      href: `/cases/${cs.id}/`,
      conceptIds: cs.concepts,
      text: [cs.summary, ...verified, ...cs.rootCauses.map((r) => r.text)].join('\n'),
    })
  }
  return chunks
}
