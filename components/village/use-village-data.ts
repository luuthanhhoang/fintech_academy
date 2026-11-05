'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo, useState } from 'react'
import type { Catalog } from '@/lib/content/catalog'
import { db } from '@/lib/db/dexie'
import { plotHealth, type PlotHealth } from '@/lib/world/health'
import { buildWorldLayout } from '@/lib/world/layout'
import { plantsFromSessions } from '@/lib/world/plants'
import { createTerrain } from '@/lib/world/terrain'
import { useDueCards, useMastery } from '@/components/data/use-learner'

/** Terrain + layout are deterministic from content, computed once per catalog. */
export function useWorld(catalog: Catalog) {
  return useMemo(() => {
    const terrain = createTerrain(catalog.world.map)
    return { terrain, layout: buildWorldLayout(catalog, terrain) }
  }, [catalog])
}

/** Learner state as the village shows it: plot health, the focus forest, due cards (fish), focus records. */
export function useVillageLearner(catalog: Catalog, world: ReturnType<typeof useWorld>) {
  const mastery = useMastery(catalog)
  const due = useDueCards()
  const sessions = useLiveQuery(() => db().focusSessions.orderBy('startedAt').toArray(), [])
  const focusTrack = useLiveQuery(async () => {
    const v = (await db().settings.get('focusTrack'))?.value
    return typeof v === 'string' ? v : null
  }, [])
  const health = useMemo(() => {
    const out = new Map<string, PlotHealth>()
    if (mastery.status !== 'ready') return out
    for (const c of catalog.concepts) out.set(c.id, plotHealth(mastery.states.get(c.id) ?? 'locked', mastery.scores.get(c.id), catalog.config.mastery.unlockAt))
    return out
  }, [mastery, catalog])
  const plants = useMemo(() => (sessions ? plantsFromSessions(sessions, catalog, world.layout, world.terrain) : []), [sessions, catalog, world])
  return { health, plants, sessions: sessions ?? [], dueCount: due?.length ?? 0, focusTrack: focusTrack ?? null, ready: mastery.status === 'ready' && sessions !== undefined }
}

/** Current time, refreshed every `ms` (the sky only needs minute resolution). */
export function useClock(ms: number) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), ms)
    return () => window.clearInterval(id)
  }, [ms])
  return now
}

/** WebGL availability (false on very old devices or when blocked); null until checked. */
export function useWebGL() {
  const [ok, setOk] = useState<boolean | null>(null)
  useEffect(() => {
    let supported = false
    try {
      const c = document.createElement('canvas')
      supported = !!(c.getContext('webgl2') ?? c.getContext('webgl'))
    } catch {
      supported = false
    }
    const id = window.setTimeout(() => setOk(supported), 0)
    return () => window.clearTimeout(id)
  }, [])
  return ok
}
