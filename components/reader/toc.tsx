'use client'

import { useEffect, useState } from 'react'
import { startLesson, updateScroll } from '@/lib/db/repos/learning'
import { ProgressBar } from '@/components/ui/primitives'

export interface TocItem {
  slug: string
  heading: string
  depth: number
}

/** Table of contents with active-section highlight + reading progress persisted per lesson. */
export function ReadingAids({ lessonId, items }: { lessonId: string; items: TocItem[] }) {
  const [progress, setProgress] = useState(0)
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    void startLesson(lessonId)
    let saved = 0
    const onScroll = () => {
      const el = document.getElementById('lesson-body')
      if (!el) return
      const rect = el.getBoundingClientRect()
      const total = rect.height - window.innerHeight
      const ratio = total <= 0 ? 1 : Math.min(1, Math.max(0, -rect.top / total))
      setProgress(ratio)
      if (ratio - saved > 0.05 || ratio === 1) {
        saved = ratio
        void updateScroll(lessonId, ratio)
      }
      const headings = items.map((i) => document.getElementById(i.slug)).filter((h): h is HTMLElement => !!h)
      const current = [...headings].reverse().find((h) => h.getBoundingClientRect().top < 120)
      setActive(current?.id ?? null)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [lessonId, items])

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 lg:left-60">
        <ProgressBar value={progress} label="Tiến độ đọc bài" />
      </div>
      <nav aria-label="Mục lục" className="font-sans text-sm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-3">Mục lục</p>
        <ol className="space-y-1 border-l border-rule">
          {items.map((i) => (
            <li key={i.slug} style={{ paddingLeft: `${(i.depth - 2) * 0.75 + 0.75}rem` }}>
              <a
                href={`#${i.slug}`}
                aria-current={active === i.slug ? 'location' : undefined}
                className="-ml-px block border-l border-transparent py-0.5 text-ink-3 hover:text-ink aria-[current=location]:border-accent aria-[current=location]:text-accent"
              >
                {i.heading}
              </a>
            </li>
          ))}
        </ol>
        <p className="num mt-3 text-xs text-ink-3">Đã đọc {Math.round(progress * 100)}%</p>
      </nav>
    </>
  )
}
