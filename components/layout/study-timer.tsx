'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { addStudyTime } from '@/lib/db/repos/activity'
import { useCatalogState } from '@/components/data/catalog-provider'

const TICK_MS = 5_000
const FLUSH_EVERY_TICKS = 6

/**
 * Measures real active study time: the tab must be visible and the learner must have interacted
 * within the configured idle timeout. Flushes to IndexedDB periodically and on page hide.
 */
export function StudyTimer() {
  const path = usePathname()
  const state = useCatalogState()
  const idleMs = state.status === 'ready' ? state.catalog.config.today.idleTimeoutSeconds * 1000 : null

  useEffect(() => {
    if (idleMs === null) return
    let lastInput = Date.now()
    let pending = 0
    let ticks = 0
    const onInput = () => {
      lastInput = Date.now()
    }
    const flush = () => {
      const ms = pending
      pending = 0
      if (ms > 0) void addStudyTime(path, ms)
    }
    const events = ['pointerdown', 'keydown', 'scroll', 'wheel', 'touchstart'] as const
    events.forEach((e) => window.addEventListener(e, onInput, { passive: true }))
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible' && Date.now() - lastInput < idleMs) pending += TICK_MS
      if (++ticks % FLUSH_EVERY_TICKS === 0) flush()
    }, TICK_MS)
    const onHide = () => document.visibilityState === 'hidden' && flush()
    document.addEventListener('visibilitychange', onHide)
    return () => {
      flush()
      window.clearInterval(timer)
      events.forEach((e) => window.removeEventListener(e, onInput))
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [path, idleMs])
  return null
}
