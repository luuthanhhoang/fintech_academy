'use client'

import { Suspense } from 'react'
import { useCatalogState } from '@/components/data/catalog-provider'
import { ErrorState, Skeleton } from '@/components/ui/states'
import { VillageView } from './village-view'

/** Client entry: waits for the catalog, then mounts the village (which reads ?place, ?view, ?journey). */
export function VillageEntry() {
  const state = useCatalogState()
  if (state.status === 'loading') return <Skeleton lines={6} className="p-6" />
  if (state.status === 'error') return <ErrorState error={state.error} retry={state.retry} />
  return (
    <Suspense fallback={<Skeleton lines={6} className="p-6" />}>
      <VillageView catalog={state.catalog} />
    </Suspense>
  )
}
