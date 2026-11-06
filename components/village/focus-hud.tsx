'use client'

import Link from 'next/link'
import { useState } from 'react'
import { currentTask, phaseProgress, remainingMs } from '@/lib/focus/machine'
import { clock } from '@/components/focus/format'
import { useFocus } from '@/components/focus/focus-provider'
import { Button } from '@/components/ui/primitives'
import { Panel } from './panel'

/** Timer, segment dots and the current task while a journey runs. */
export function FocusHud({ stationNames }: { stationNames: string[] }) {
  const { active, now, giveUp, skipBreak } = useFocus()
  const [confirm, setConfirm] = useState(false)
  if (!active) return null
  const task = currentTask(active)
  const next = stationNames[active.segment + 1]
  return (
    <Panel className="w-full sm:w-80">
      <p className="text-[11px] text-ink-3">
        {active.phase === 'focus' ? `Chặng ${active.segment + 1}/${active.segments} — tàu đang chạy` : 'Dừng ga — giờ nghỉ'}
      </p>
      <p className="num font-display text-4xl font-semibold" aria-live="off">
        {clock(remainingMs(active, now))}
      </p>
      <div className="mt-1 flex gap-1" aria-hidden="true">
        {Array.from({ length: active.segments }, (_, i) => (
          <span key={i} className="h-1.5 flex-1 overflow-hidden rounded bg-paper-2">
            <span className="block h-full bg-accent" style={{ width: `${i < active.segment ? 100 : i === active.segment && active.phase === 'focus' ? phaseProgress(active, now) * 100 : i === active.segment ? 100 : 0}%` }} />
          </span>
        ))}
      </div>
      {next && <p className="mt-1 text-xs text-ink-3">Ga kế tiếp: {next}</p>}
      {task && (
        <Link href={task.href} className="mt-2 block rounded-md bg-accent-soft px-2 py-1.5 text-accent underline">
          {task.label}
        </Link>
      )}
      <div className="mt-3 flex gap-2">
        {active.phase === 'break' && (
          <Button variant="primary" onClick={skipBreak}>
            Lên tàu ngay
          </Button>
        )}
        {active.phase === 'focus' &&
          (confirm ? (
            <>
              <Button onClick={giveUp}>Bỏ chặng (cây héo)</Button>
              <Button onClick={() => setConfirm(false)}>Tiếp tục</Button>
            </>
          ) : (
            <Button onClick={() => setConfirm(true)}>Dừng…</Button>
          ))}
      </div>
    </Panel>
  )
}
