/** Book structure derived from content: parts (tracks) → chapters (stages) → lessons, plus shared numbering/registries. */
import type { ContentBundle, Lesson, Source, Track } from '../../lib/content/types'

export interface LessonEntry {
  lesson: Lesson
  partNo: number
  chapterNo: number
  /** "3.2" — chapter.lesson */
  no: string
  anchor: string
}

export interface ChapterEntry {
  track: Track
  stage: Track['stages'][number]
  chapterNo: number
  anchor: string
  /** Slug used for the CSS named page (running header). */
  pageName: string
  lessons: LessonEntry[]
}

export interface PartEntry {
  track: Track
  partNo: number
  anchor: string
  chapters: ChapterEntry[]
}

export interface Model {
  parts: PartEntry[]
  chapters: ChapterEntry[]
  lessons: LessonEntry[]
}

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII']
export const roman = (n: number): string => ROMAN[n] ?? String(n)

export function buildModel(b: ContentBundle): Model {
  const tracks = [...b.tracks].sort((x, y) => x.order - y.order)
  let chapterNo = 0
  const parts: PartEntry[] = tracks.map((track, pi) => {
    const stages = [...track.stages].sort((x, y) => x.order - y.order)
    const chapters: ChapterEntry[] = stages.map((stage) => {
      chapterNo += 1
      const lessons = b.lessons
        .filter((l) => l.track === track.id && l.stage === stage.id)
        .sort((x, y) => x.order - y.order)
        .map((lesson, i): LessonEntry => ({ lesson, partNo: pi + 1, chapterNo, no: `${chapterNo}.${i + 1}`, anchor: `l-${lesson.id}` }))
      return { track, stage, chapterNo, anchor: `c-${track.id}-${stage.id}`, pageName: `ch-${track.id}-${stage.id}`, lessons }
    })
    return { track, partNo: pi + 1, anchor: `p-${track.id}`, chapters: chapters.filter((c) => c.lessons.length > 0) }
  })
  const chapters = parts.flatMap((p) => p.chapters)
  return { parts, chapters, lessons: chapters.flatMap((c) => c.lessons) }
}

/** Mutable registries shared across the whole render (citations, figure numbers, appendix material). */
export class Registry {
  private cited: string[] = []
  private caseOrder: string[] = []
  private scenarioOrder: string[] = []
  private labOrder: string[] = []
  readonly simSeen = new Map<string, string>()
  readonly answers = new Map<string, string[]>()
  readonly solutions = new Map<string, string[]>()
  private figures = new Map<number, number>()

  constructor(readonly sources: Map<string, Source>) {}

  /** Citation number of a source (assigned on first use, 1-based). */
  cite(id: string): number {
    let i = this.cited.indexOf(id)
    if (i < 0) {
      this.cited.push(id)
      i = this.cited.length - 1
    }
    return i + 1
  }

  citedIds(): string[] {
    return [...this.cited]
  }

  private ref(list: string[], id: string): number {
    let i = list.indexOf(id)
    if (i < 0) {
      list.push(id)
      i = list.length - 1
    }
    return i + 1
  }

  caseNo(id: string): number { return this.ref(this.caseOrder, id) }
  scenarioNo(id: string): number { return this.ref(this.scenarioOrder, id) }
  labNo(id: string): number { return this.ref(this.labOrder, id) }
  cases(): string[] { return [...this.caseOrder] }
  scenarios(): string[] { return [...this.scenarioOrder] }
  labs(): string[] { return [...this.labOrder] }

  /** "Hình 3.2": figure counter restarts for every chapter. */
  figureNo(chapterNo: number): string {
    const n = (this.figures.get(chapterNo) ?? 0) + 1
    this.figures.set(chapterNo, n)
    return `${chapterNo}.${n}`
  }

  push(map: Map<string, string[]>, lessonId: string, html: string): void {
    const arr = map.get(lessonId) ?? []
    arr.push(html)
    map.set(lessonId, arr)
  }
}

/** One entry of the document outline (every h1–h6 emitted, in order); `toc` entries feed the table of contents. */
export interface OutlineItem {
  level: number
  text: string
  id: string
  toc: boolean
  /** Visible text when it differs from `text` (used to map PDF bookmarks back to this item). */
  match?: string
}

export class Outline {
  readonly items: OutlineItem[] = []
  add(item: OutlineItem): number {
    this.items.push(item)
    return this.items.length - 1
  }
}
