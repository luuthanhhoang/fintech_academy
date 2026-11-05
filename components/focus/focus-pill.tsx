'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { currentTask, remainingMs } from '@/lib/focus/machine'
import { useFocus } from './focus-provider'
import { clock } from './format'

const NOTICE_MS = 7000

/** Floating timer on every page except the village (which has its own HUD). */
export function FocusPill() {
  const path = usePathname()
  const { active, now, notice } = useFocus()
  const inVillage = path.startsWith('/village')
  const showNotice = notice && now - notice.at < NOTICE_MS
  if (inVillage || (!active && !showNotice)) return null
  const task = active ? currentTask(active) : null
  return (
    <div role="status" aria-live="polite" className="fixed bottom-20 right-3 z-40 max-w-xs rounded-xl border border-rule bg-paper/95 p-3 font-sans text-sm shadow-lg backdrop-blur lg:bottom-4">
      {showNotice && <p className={notice.kind === 'withered' ? 'text-bad' : 'text-good'}>{notice.text}</p>}
      {active && (
        <div className="mt-1">
          <p className="num text-lg font-semibold">
            {active.phase === 'focus' ? 'Tập trung' : 'Nghỉ'} · {clock(remainingMs(active, now))}
            <span className="ml-2 text-xs font-normal text-ink-3">chặng {active.segment + 1}/{active.segments}</span>
          </p>
          {task && (
            <Link href={task.href} className="block truncate text-xs text-accent underline">
              {task.label}
            </Link>
          )}
          <Link href="/village/" className="mt-1 inline-block text-xs underline">
            Về làng học
          </Link>
        </div>
      )}
    </div>
  )
}
