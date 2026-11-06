'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import Link from 'next/link'
import type { Catalog } from '@/lib/content/catalog'
import { db } from '@/lib/db/dexie'
import { focusStats } from '@/lib/stats/focus'
import { fmtNum } from '@/lib/util/format'
import { Card } from '@/components/ui/primitives'

const DAYS = 14

/** Focus journeys from recorded segments: minutes per day, trees grown vs withered, streak. */
export function FocusCard({ catalog }: { catalog: Catalog }) {
  const sessions = useLiveQuery(() => db().focusSessions.toArray(), [])
  if (!sessions) return null
  const s = focusStats(sessions, new Date(), DAYS)
  const max = Math.max(1, ...s.daily.map((d) => d.minutes))
  const goal = catalog.config.focus.dailyGoalMinutes
  return (
    <Card>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-serif text-lg font-semibold">Tập trung theo chặng</h2>
        <Link href="/" className="text-xs underline">
          Mở làng học
        </Link>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
        <div><dt className="text-xs text-ink-3">Hôm nay</dt><dd className="num text-xl">{fmtNum(s.todayMinutes, 0)} / {goal} phút</dd></div>
        <div><dt className="text-xs text-ink-3">Tổng thời gian tập trung</dt><dd className="num text-xl">{s.totalMinutes < 60 ? `${fmtNum(s.totalMinutes, 0)} phút` : `${fmtNum(s.totalMinutes / 60, 1)} giờ`}</dd></div>
        <div><dt className="text-xs text-ink-3">Cây lớn / cây héo</dt><dd className="num text-xl">{s.completed} / {s.abandoned}</dd></div>
        <div><dt className="text-xs text-ink-3">Chuỗi ngày có chặng hoàn thành</dt><dd className="num text-xl">{s.streakDays} ngày</dd></div>
      </dl>
      <div className="mt-4 flex h-24 items-end gap-1" role="img" aria-label={`Số phút tập trung ${DAYS} ngày gần nhất: ${s.daily.map((d) => `${d.day} ${Math.round(d.minutes)} phút`).join(', ')}`}>
        {s.daily.map((d) => (
          <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
            <div className="w-full rounded-t bg-[var(--chart-3)]" style={{ height: `${(d.minutes / max) * 80}px` }} title={`${d.day}: ${Math.round(d.minutes)} phút`} />
            <span className="num text-[9px] text-ink-3">{d.day.slice(8)}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
