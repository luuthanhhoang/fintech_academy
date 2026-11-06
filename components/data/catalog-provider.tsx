'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Catalog } from '@/lib/content/catalog'

type CatalogState = { status: 'loading' } | { status: 'error'; error: Error; retry: () => void } | { status: 'ready'; catalog: Catalog }
type Loaded = { status: 'error'; error: Error } | { status: 'ready'; catalog: Catalog }

const Ctx = createContext<CatalogState>({ status: 'loading' })

/** Loads the build-time catalog once per page load and shares it with every client feature. */
export function CatalogProvider({ children }: { children: ReactNode }) {
  const [attempt, setAttempt] = useState(0)
  const [loaded, setLoaded] = useState<{ attempt: number; value: Loaded } | null>(null)

  useEffect(() => {
    let cancelled = false
    // no-cache: revalidate every visit, so a new deploy (or a pull in dev) never pairs new code with an old catalog.
    fetch('/data/catalog.json', { cache: 'no-cache' })
      .then((r) => {
        if (!r.ok) throw new Error(`Không tải được catalog (HTTP ${r.status})`)
        return r.json() as Promise<Catalog>
      })
      .then(
        (catalog) => !cancelled && setLoaded({ attempt, value: { status: 'ready', catalog } }),
        (e: unknown) => !cancelled && setLoaded({ attempt, value: { status: 'error', error: e instanceof Error ? e : new Error(String(e)) } }),
      )
    return () => {
      cancelled = true
    }
  }, [attempt])

  const state: CatalogState =
    !loaded || loaded.attempt !== attempt
      ? { status: 'loading' }
      : loaded.value.status === 'error'
        ? { ...loaded.value, retry: () => setAttempt((a) => a + 1) }
        : loaded.value
  return <Ctx.Provider value={state}>{children}</Ctx.Provider>
}

export function useCatalogState(): CatalogState {
  return useContext(Ctx)
}
