'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo, useState } from 'react'
import type { Catalog } from '@/lib/content/catalog'
import { db } from '@/lib/db/dexie'
import type { CardRecord } from '@/lib/db/types'
import { computeMastery, type MasteryView } from '@/lib/mastery/compute'
import { retrievability } from '@/lib/srs/fsrs'

/** Live snapshot of every record mastery depends on. `undefined` while loading. */
export function useLearnerRecords() {
  return useLiveQuery(async () => {
    const [attempts, cards, progress, marks] = await Promise.all([
      db().quizAttempts.toArray(),
      db().cards.toArray(),
      db().progress.toArray(),
      db().marks.toArray(),
    ])
    return { attempts, cards, progress, marks }
  }, [])
}

function useRetrievability(catalog: Catalog, cards: readonly CardRecord[] | undefined) {
  const [map, setMap] = useState<Map<string, number> | null>(null)
  useEffect(() => {
    if (!cards) return
    let cancelled = false
    const now = new Date()
    Promise.all(cards.map(async (c) => [c.id, await retrievability(catalog.config.srs, c.fsrs, now)] as const)).then((pairs) => {
      if (cancelled) return
      setMap(new Map(pairs.filter((p): p is readonly [string, number] => p[1] !== null)))
    })
    return () => {
      cancelled = true
    }
  }, [catalog, cards])
  return map
}

export type MasteryResult = { status: 'loading' } | ({ status: 'ready' } & MasteryView & { records: NonNullable<ReturnType<typeof useLearnerRecords>> })

/** Concept scores and states from real quiz + review data. */
export function useMastery(catalog: Catalog): MasteryResult {
  const records = useLearnerRecords()
  const r = useRetrievability(catalog, records?.cards)
  return useMemo(() => {
    if (!records || !r) return { status: 'loading' }
    return { status: 'ready', records, ...computeMastery(catalog, { ...records, retrievability: r }, new Date()) }
  }, [catalog, records, r])
}

export function useDueCards() {
  return useLiveQuery(() => db().cards.where('fsrs.dueAt').belowOrEqual(new Date()).sortBy('fsrs.dueAt'), [])
}
