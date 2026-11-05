'use client'

import { useState } from 'react'
import type { Catalog } from '@/lib/content/catalog'
import { journeyRegion, journeyTasks } from '@/lib/focus/tasks'
import { focusStats } from '@/lib/stats/focus'
import type { FocusSessionRecord } from '@/lib/db/types'
import { WhyLink } from '@/components/learn/why-link'
import { useFocus } from '@/components/focus/focus-provider'
import { useToday } from '@/components/today/use-today'
import { Button, ProgressBar } from '@/components/ui/primitives'
import { Panel } from './panel'

/** Pick a journey; each segment gets a task from today's plan (configurable order in focus.yaml). */
export function JourneyPanel({ catalog, sessions, focusTrack, preselect, onStarted }: { catalog: Catalog; sessions: FocusSessionRecord[]; focusTrack: string | null; preselect: string | null; onStarted: (viewId: string) => void }) {
  const cfg = catalog.config.focus
  const focus = useFocus()
  const today = useToday(catalog)
  const [pick, setPick] = useState(preselect && cfg.journeys.some((j) => j.id === preselect) ? preselect : cfg.journeys[0]!.id)
  const journey = cfg.journeys.find((j) => j.id === pick) ?? cfg.journeys[0]!
  const tasks = today ? journeyTasks(cfg, today.plan, catalog, today.dueCount, journey.segments) : []
  const stats = focusStats(sessions, new Date())
  return (
    <Panel title="Hành trình tập trung" className="w-full sm:w-80">
      <ProgressBar value={Math.min(1, stats.todayMinutes / cfg.dailyGoalMinutes)} label={`Hôm nay ${Math.round(stats.todayMinutes)}/${cfg.dailyGoalMinutes} phút`} />
      <fieldset className="mt-3 flex flex-col gap-1.5">
        <legend className="sr-only">Chọn hành trình</legend>
        {cfg.journeys.map((j) => (
          <label key={j.id} className={`flex cursor-pointer gap-2 rounded-md border p-2 ${j.id === pick ? 'border-accent bg-accent-soft' : 'border-rule'}`}>
            <input type="radio" name="journey" value={j.id} checked={j.id === pick} onChange={() => setPick(j.id)} className="mt-1" />
            <span>
              <span className="block font-medium">{j.title}</span>
              <span className="block text-xs text-ink-3">{j.description}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <ol className="mt-3 list-decimal space-y-0.5 pl-5 text-xs text-ink-2">
        {tasks.map((t, i) => (
          <li key={i}>{t ? t.label : 'Tự chọn nội dung học'}</li>
        ))}
      </ol>
      <Button
        variant="primary"
        className="mt-3 w-full"
        disabled={!today}
        onClick={() => {
          focus.start(journey, tasks, journeyRegion(catalog, tasks, focusTrack))
          onStarted(journey.view)
        }}
      >
        Lên tàu — bắt đầu {journey.focusMinutes} phút
      </Button>
      <p className="mt-2 text-[11px] leading-snug text-ink-3">
        Bạn có thể mở bài học, quiz, code lab trong lúc tàu chạy — chuyển trang trong site không làm cây héo. Rời tab quá {cfg.graceSeconds} giây thì cây non héo.
      </p>
      <div className="mt-1">
        <WhyLink method="timed-breaks" label="Vì sao học theo chặng có giờ nghỉ?" />
      </div>
    </Panel>
  )
}
