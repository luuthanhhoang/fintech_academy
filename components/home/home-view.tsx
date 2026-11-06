'use client'

import Link from 'next/link'
import { useSyncExternalStore } from 'react'
import type { Catalog } from '@/lib/content/catalog'
import { lineProgress, lineStations, type LessonStatus } from '@/lib/roadmap/line'
import { useMastery } from '@/components/data/use-learner'
import { Line } from '@/components/roadmap/transit-map'
import { useToday } from '@/components/today/use-today'
import { minutes } from '@/components/ui/primitives'
import { Skeleton } from '@/components/ui/states'

const subscribe = () => () => {}
/** "Chào buổi sáng / chiều / tối" from the visitor's clock (client only). */
function useGreeting() {
  return useSyncExternalStore(
    subscribe,
    () => {
      const h = new Date().getHours()
      return h < 11 ? 'Chào buổi sáng' : h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'
    },
    () => 'Xin chào',
  )
}

/** The lesson to open now: the one in progress, else the next one along the curriculum. */
function ContinueCard({ catalog }: { catalog: Catalog }) {
  const today = useToday(catalog)
  if (!today) return <Skeleton lines={6} />
  const l = today.plan.lesson
  const blocks = catalog.config.today.blocks
  const done = blocks.filter((b) => today.completed.has(b.id)).length
  const track = l ? catalog.tracks.find((t) => t.id === l.track) : null
  const stage = track?.stages.find((s) => s.id === l?.stage)
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      {l ? (
        <Link href={`/lessons/${l.id}/`} className="group relative overflow-hidden rounded-3xl bg-card p-7 ring-1 ring-rule/70 transition-shadow hover:shadow-[0_24px_48px_-28px_rgba(23,33,29,0.45)] sm:p-9">
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-2" style={{ background: `var(--line-${l.track})` }} />
          <p className="text-sm text-ink-3">
            Học tiếp · {track?.title.vi} · {stage?.title.vi}
          </p>
          <h2 className="mt-3 max-w-[26ch] font-display text-[1.75rem] font-bold leading-tight group-hover:underline sm:text-[2rem]">{l.title.vi}</h2>
          <p className="mt-4 max-w-[60ch] font-[family-name:var(--font-read)] text-lg italic leading-relaxed text-ink-2">{l.whyQuestion}</p>
          <p className="mt-6 flex flex-wrap items-center gap-4">
            <span className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-card">Mở bài học</span>
            <span className="text-sm text-ink-3">{minutes(l.estMinutes)}</span>
          </p>
        </Link>
      ) : (
        <div className="rounded-3xl bg-card p-8 ring-1 ring-rule/70">
          <h2 className="font-display text-2xl font-bold">Bạn đã học hết các bài đã viết</h2>
          <p className="mt-2 text-ink-2">Các bài còn lại đang được viết. Trong lúc chờ, ôn thẻ và luyện trộn để giữ kiến thức.</p>
        </div>
      )}
      <div className="grid gap-4">
        <Link href="/review/" className="group rounded-3xl bg-ink p-7 text-card">
          <p className="num font-display text-5xl font-bold">{today.dueCount}</p>
          <p className="mt-1 text-card/80">{today.dueCount === 0 ? 'thẻ đến hạn — hôm nay đã ôn đủ' : 'thẻ cần ôn hôm nay'}</p>
          <p className="mt-4 text-sm font-semibold group-hover:underline">Ôn thẻ</p>
        </Link>
        <Link href="/today/" className="group rounded-3xl bg-card p-7 ring-1 ring-rule/70">
          <p className="num font-display text-3xl font-bold">
            {done}
            <span className="text-ink-3">/{blocks.length}</span>
          </p>
          <p className="mt-1 text-ink-2">việc trong kế hoạch hôm nay đã xong</p>
          <p className="mt-4 text-sm font-semibold text-accent group-hover:underline">Xem kế hoạch hôm nay</p>
        </Link>
      </div>
    </div>
  )
}

/** Each track as its line, with your progress along it. */
function Tracks({ catalog }: { catalog: Catalog }) {
  const mastery = useMastery(catalog)
  if (mastery.status === 'loading') return <Skeleton lines={8} />
  const progress = new Map<string, LessonStatus>(mastery.records.progress.map((p) => [p.lessonId, p.status]))
  return (
    <div className="space-y-12">
      {[...catalog.tracks]
        .sort((a, b) => a.order - b.order)
        .map((t) => {
          const stations = lineStations(catalog, t.id, progress)
          const share = lineProgress(stations)
          return (
            <section key={t.id} aria-labelledby={`home-${t.id}`}>
              <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
                <h3 id={`home-${t.id}`} className="font-display text-xl font-bold">
                  <Link href={`/tracks/${t.id}/`} className="hover:underline">
                    {t.title.vi}
                  </Link>
                </h3>
                <span className="num text-sm text-ink-3">{share === null ? 'Chưa có bài' : `${Math.round(share * 100)}% đã học`}</span>
              </div>
              <Line track={t} stations={stations} />
            </section>
          )
        })}
    </div>
  )
}

export function HomeView({ catalog }: { catalog: Catalog }) {
  const greeting = useGreeting()
  return (
    <div className="font-sans">
      <header className="mb-10">
        <p className="text-ink-3">{greeting}</p>
        <h1 className="mt-1 font-display text-[2.4rem] font-bold leading-[1.08] sm:text-[3.2rem]">Hôm nay học gì?</h1>
      </header>
      <ContinueCard catalog={catalog} />
      <section aria-labelledby="home-tracks" className="mt-20">
        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="home-tracks" className="font-display text-2xl font-bold">
            Lộ trình
          </h2>
          <Link href="/tracks/" className="text-sm font-medium text-accent hover:underline">
            Xem tất cả bài học
          </Link>
        </div>
        <Tracks catalog={catalog} />
      </section>
    </div>
  )
}
