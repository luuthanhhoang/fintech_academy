import { describe, expect, it } from 'vitest'
import { buildCatalog } from '@/lib/content/catalog'
import { loadContent } from '@/lib/content/load'
import { lineProgress, lineStations, nextOnLine, type LessonStatus } from '@/lib/roadmap/line'

const catalog = buildCatalog(loadContent())

describe('track as a rail line', () => {
  it('lists every station in order with written and planned counts', () => {
    for (const t of catalog.tracks) {
      const st = lineStations(catalog, t.id, new Map())
      expect(st.map((s) => s.stageId)).toEqual([...t.stages].sort((a, b) => a.order - b.order).map((s) => s.id))
      expect(st.reduce((a, s) => a + s.written, 0)).toBe(catalog.lessons.filter((l) => l.track === t.id).length)
      expect(lineProgress(st)).toBe(0)
    }
  })
  it('moves the next lesson forward as lessons are completed', () => {
    const first = nextOnLine(catalog, 'web', new Map())!
    const progress = new Map<string, LessonStatus>([[first.id, 'completed']])
    const second = nextOnLine(catalog, 'web', progress)!
    expect(second.id).not.toBe(first.id)
    const st = lineStations(catalog, 'web', progress)
    expect(st.reduce((a, s) => a + s.done, 0)).toBe(1)
  })
})
