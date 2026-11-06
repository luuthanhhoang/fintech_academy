/**
 * Client catalog: the slim, serialisable subset of content that client-side features need
 * (Today, review, mastery, stats, tutor). Served at /generated/catalog.json (app/generated route, static at build).
 */
import type { ContentBundle, Lesson } from './types'

export type CatalogLesson = Omit<Lesson, 'body' | 'devMapping' | 'facts' | 'sources' | 'applications' | 'examples' | 'diagrams'>

export interface Catalog {
  config: ContentBundle['config']
  world: ContentBundle['world']
  tracks: ContentBundle['tracks']
  concepts: ContentBundle['concepts']
  lessons: CatalogLesson[]
  planned: ContentBundle['planned']
  simulators: Pick<ContentBundle['simulators'][number], 'id' | 'title' | 'summary' | 'concepts' | 'dataKind'>[]
  labs: Pick<ContentBundle['labs'][number], 'id' | 'title' | 'summary' | 'concepts'>[]
  cases: Pick<ContentBundle['cases'][number], 'id' | 'title' | 'period' | 'summary' | 'concepts' | 'questions'>[]
  scenarios: Pick<ContentBundle['scenarios'][number], 'id' | 'title' | 'role' | 'summary' | 'concepts'>[]
}

export function buildCatalog(b: ContentBundle): Catalog {
  return {
    config: b.config,
    world: b.world,
    tracks: b.tracks,
    concepts: b.concepts,
    lessons: b.lessons.map((l) => ({
      id: l.id, track: l.track, stage: l.stage, order: l.order, title: l.title, summary: l.summary, concepts: l.concepts,
      estMinutes: l.estMinutes, whyQuestion: l.whyQuestion, simulators: l.simulators, labs: l.labs, cases: l.cases,
      lastVerified: l.lastVerified, status: l.status, selfExplain: l.selfExplain, quiz: l.quiz, exercises: l.exercises,
      pretest: l.pretest, scenarios: l.scenarios,
    })),
    planned: b.planned,
    simulators: b.simulators.map(({ id, title, summary, concepts, dataKind }) => ({ id, title, summary, concepts, dataKind })),
    labs: b.labs.map(({ id, title, summary, concepts }) => ({ id, title, summary, concepts })),
    scenarios: b.scenarios.map(({ id, title, role, summary, concepts }) => ({ id, title, role, summary, concepts })),
    cases: b.cases.map(({ id, title, period, summary, concepts, questions }) => ({ id, title, period, summary, concepts, questions })),
  }
}

/** Global curriculum rank: track order, then stage order, then lesson order. */
export function stageRank(tracks: Catalog['tracks']): Map<string, number> {
  const out = new Map<string, number>()
  for (const t of tracks) for (const s of t.stages) out.set(s.id, t.order * 1000 + s.order)
  return out
}
