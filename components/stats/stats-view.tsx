'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import type { Catalog } from '@/lib/content/catalog'
import { db } from '@/lib/db/dexie'
import { stageMastery } from '@/lib/mastery/compute'
import { GRADES } from '@/lib/srs/fsrs'
import { pretestProgress, summarizeStats } from '@/lib/stats/aggregate'
import { fmtDuration, fmtNum, fmtPct } from '@/lib/util/format'
import { useMastery } from '@/components/data/use-learner'
import { Card } from '@/components/ui/primitives'
import { EmptyState, Skeleton } from '@/components/ui/states'
import { FocusCard } from './focus-card'
import { ActivityHeatmap } from './heatmap'

const WINDOW_DAYS = 84

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <p className="text-xs text-ink-3">{label}</p>
      <p className="num mt-1 text-2xl">{value}</p>
      {hint && <p className="text-xs text-ink-3">{hint}</p>}
    </Card>
  )
}

export function StatsView({ catalog }: { catalog: Catalog }) {
  const mastery = useMastery(catalog)
  const data = useLiveQuery(async () => {
    const [sessions, reviews, attempts, practice, explains, progress] = await Promise.all([
      db().studySessions.toArray(), db().reviewLogs.toArray(), db().quizAttempts.toArray(), db().practiceLogs.toArray(), db().selfExplains.toArray(), db().progress.toArray(),
    ])
    return { sessions, reviews, attempts, practice, explains, progress }
  }, [])
  if (!data || mastery.status !== 'ready') return <Skeleton lines={10} />
  const s = summarizeStats(data, new Date(), WINDOW_DAYS)
  const stages = stageMastery(catalog, mastery.scores)
  const empty = s.activeDayCount === 0
  const maxGrade = Math.max(1, ...s.gradeCounts)
  const pre = pretestProgress(data.attempts)
  const scenarioRuns = data.practice.filter((p) => p.kind === 'scenario')
  return (
    <div className="space-y-6 font-sans">
      {empty && <EmptyState title="Chưa có dữ liệu học tập">Mọi con số ở đây đều tính từ hoạt động thật của bạn (lưu trên trình duyệt). Học một bài hoặc ôn thẻ để bắt đầu.</EmptyState>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Chuỗi ngày học liên tiếp" value={`${s.streak} ngày`} hint={`dài nhất ${s.longest} ngày`} />
        <Tile label="Thời gian học" value={fmtDuration(s.totalMs)} hint={`${s.activeDayCount} ngày có học · chỉ tính lúc trang mở và bạn đang thao tác`} />
        <Tile label="Lượt ôn thẻ" value={fmtNum(s.reviewsTotal, 0)} />
        <Tile label="Quiz đúng" value={s.quizAccuracy === null ? '—' : fmtPct(s.quizAccuracy, 0)} hint={`${s.quizTotal} lượt`} />
        <Tile label="Bài đã hoàn thành" value={fmtNum(s.lessonsCompleted, 0)} hint={`/ ${catalog.lessons.length} bài đã viết`} />
        <Tile label="Lab đã qua" value={fmtNum(s.labsPassed, 0)} hint={`/ ${catalog.labs.length} lab`} />
        <Tile label="Đoán sai → học xong làm đúng" value={`${pre.wrongThenRight}/${pre.items}`} hint={`đúng cả trước & sau ${pre.rightThenRight} · vẫn sai ${pre.stillWrong} · chưa làm lại ${pre.notRetested}`} />
        <Tile label="Tình huống đã chơi" value={fmtNum(new Set(scenarioRuns.map((p) => p.refId)).size, 0)} hint={`/ ${catalog.scenarios.length} · kết cục tốt ${scenarioRuns.filter((p) => p.result === 'passed').length} lần`} />
      </div>
      <Card>
        <h2 className="font-display text-lg font-semibold">Hoạt động {WINDOW_DAYS} ngày gần nhất</h2>
        <ActivityHeatmap days={s.daily} />
      </Card>
      <FocusCard catalog={catalog} />
      <Card>
        <h2 className="font-display text-lg font-semibold">Thành thạo theo chặng</h2>
        <ul className="mt-3 space-y-2">
          {stages.map((st) => (
            <li key={st.stageId} className="grid grid-cols-[1fr_auto] items-center gap-3 text-sm sm:grid-cols-[220px_1fr_auto]">
              <span>{st.title.vi}</span>
              <span className="hidden h-2 overflow-hidden rounded-full bg-paper-2 sm:block">
                <span className="block h-full rounded-full bg-accent" style={{ width: `${(st.mean ?? 0) * 100}%` }} />
              </span>
              <span className="num text-xs text-ink-3">{st.mean === null ? 'chưa có dữ liệu' : `${fmtPct(st.mean, 0)} · ${st.measured}/${st.total}`}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <h2 className="font-display text-lg font-semibold">Lịch sử ôn tập: phân bố đánh giá</h2>
        <ul className="mt-3 space-y-1.5">
          {GRADES.map((g, i) => (
            <li key={g.grade} className="grid grid-cols-[120px_1fr_48px] items-center gap-3 text-sm">
              <span>{g.label} ({g.en})</span>
              <span className="h-2 overflow-hidden rounded-full bg-paper-2"><span className="block h-full rounded-full bg-[var(--chart-1)]" style={{ width: `${((s.gradeCounts[i] ?? 0) / maxGrade) * 100}%` }} /></span>
              <span className="num text-right text-xs">{s.gradeCounts[i]}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
