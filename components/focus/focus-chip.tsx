'use client'

import Link from 'next/link'
import { currentTask, remainingMs } from '@/lib/focus/machine'
import { useFocus } from './focus-provider'
import { clock } from './format'

const NOTICE_MS = 7000

/** Timer chip for the top bar: visible on every page while a journey runs, so studying never loses the clock. */
export function FocusChip() {
  const { active, now } = useFocus()
  if (!active) return null
  return (
    <Link href="/" title={currentTask(active)?.label ?? 'Về làng học'} className="flex items-center gap-1.5 rounded-full border border-lantern/50 bg-lantern-soft px-2.5 py-1 font-sans text-xs text-lantern">
      <span aria-hidden="true" className="h-1.5 w-1.5 animate-pulse rounded-full bg-lantern" />
      <span className="num font-semibold">{clock(remainingMs(active, now))}</span>
      <span className="hidden sm:inline">{active.phase === 'focus' ? `chặng ${active.segment + 1}/${active.segments}` : 'nghỉ'}</span>
    </Link>
  )
}

/** Short-lived message under the top bar (a tree was planted, a tree withered, journey done). */
export function FocusToast() {
  const { notice, now } = useFocus()
  if (!notice || now - notice.at > NOTICE_MS) return null
  return (
    <div role="status" aria-live="polite" className={`fixed left-1/2 top-16 z-50 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border bg-paper px-4 py-2.5 text-center font-sans text-sm shadow-lg ${notice.kind === 'withered' ? 'border-bad/50 text-bad' : 'border-good/50 text-good'}`}>
      {notice.text}
    </div>
  )
}
