'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { FocusConfig, Journey } from '@/lib/content/schema/world'
import { loadActiveFocus, saveFocusSession, storeActiveFocus } from '@/lib/db/repos/focus'
import type { FocusTask } from '@/lib/db/types'
import { giveUp as giveUpStep, onHidden, onRestore, onVisible, skipBreak as skipBreakStep, startJourney, tick, type ActiveFocus, type FocusEvent, type Step } from '@/lib/focus/machine'
import { useCatalogState } from '@/components/data/catalog-provider'

export interface FocusNotice { kind: 'planted' | 'withered' | 'done' | 'break-over'; text: string; at: number }

interface FocusApi {
  active: ActiveFocus | null
  now: number
  notice: FocusNotice | null
  start(journey: Journey, tasks: (FocusTask | null)[], regionId: string | null): void
  giveUp(): void
  skipBreak(): void
  /** Subscribe to machine events (chimes, celebration). Returns an unsubscribe function. */
  subscribe(fn: (e: FocusEvent) => void): () => void
}

const Ctx = createContext<FocusApi | null>(null)
const HEARTBEAT_TICKS = 5

function noticeFor(e: FocusEvent, cfg: FocusConfig, at: number): FocusNotice | null {
  if (e.type === 'abandoned') return { kind: 'withered', text: cfg.copy.withered, at }
  if (e.type === 'segment-complete') return e.record.focusedMs >= cfg.minPlantMinutes * 60_000 ? { kind: 'planted', text: cfg.copy.planted, at } : null
  if (e.type === 'journey-complete') return { kind: 'done', text: cfg.copy.journeyDone, at }
  return { kind: 'break-over', text: cfg.copy.breakOver, at }
}

/** Runs the focus journey for the whole site, so studying on any page keeps the timer (and the sapling) alive. */
export function FocusProvider({ children }: { children: ReactNode }) {
  const state = useCatalogState()
  const cfg = state.status === 'ready' ? state.catalog.config.focus : null
  const [active, setActive] = useState<ActiveFocus | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [notice, setNotice] = useState<FocusNotice | null>(null)
  const ref = useRef<ActiveFocus | null>(null)
  const listeners = useRef(new Set<(e: FocusEvent) => void>())

  const apply = useCallback(
    (step: Step, persist = true) => {
      ref.current = step.next
      setActive(step.next)
      if (persist) void storeActiveFocus(step.next)
      for (const e of step.events) {
        if (e.type === 'segment-complete' || e.type === 'abandoned') void saveFocusSession(e.record)
        const n = cfg ? noticeFor(e, cfg, Date.now()) : null
        if (n) setNotice(n)
        listeners.current.forEach((fn) => fn(e))
      }
    },
    [cfg],
  )

  useEffect(() => {
    if (!cfg) return
    let cancelled = false
    void loadActiveFocus().then((a) => !cancelled && a && apply(onRestore(a, Date.now(), cfg.graceSeconds * 1000)))
    return () => {
      cancelled = true
    }
  }, [cfg, apply])

  useEffect(() => {
    if (!cfg) return
    let ticks = 0
    const id = window.setInterval(() => {
      const t = Date.now()
      setNow(t)
      const a = ref.current
      if (!a || document.visibilityState === 'hidden') return
      const step = tick(a, t)
      apply(step, step.events.length > 0 || ++ticks % HEARTBEAT_TICKS === 0)
    }, 1000)
    const onVis = () => {
      const a = ref.current
      if (!a) return
      if (document.visibilityState === 'hidden') apply({ next: onHidden(a, Date.now()), events: [] })
      else apply(onVisible(a, Date.now(), cfg.graceSeconds * 1000))
    }
    const onUnload = (e: BeforeUnloadEvent) => {
      if (ref.current?.phase === 'focus') e.preventDefault()
    }
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('beforeunload', onUnload)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('beforeunload', onUnload)
    }
  }, [cfg, apply])

  const api = useMemo<FocusApi>(
    () => ({
      active, now, notice,
      start: (journey, tasks, regionId) => apply({ next: startJourney(journey, tasks, regionId, Date.now()), events: [] }),
      giveUp: () => ref.current && apply(giveUpStep(ref.current, Date.now())),
      skipBreak: () => ref.current && apply({ next: skipBreakStep(ref.current, Date.now()), events: [] }),
      subscribe: (fn) => {
        listeners.current.add(fn)
        return () => void listeners.current.delete(fn)
      },
    }),
    [active, now, notice, apply],
  )
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useFocus(): FocusApi {
  const v = useContext(Ctx)
  if (!v) throw new Error('useFocus must be used inside <FocusProvider>')
  return v
}
