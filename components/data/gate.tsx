'use client'

import type { ReactNode } from 'react'
import type { Catalog } from '@/lib/content/catalog'
import { ErrorState, Skeleton } from '@/components/ui/states'
import { useCatalogState } from './catalog-provider'

/** Renders loading / error states until the catalog is ready. */
export function WithCatalog({ children, lines = 6 }: { children: (catalog: Catalog) => ReactNode; lines?: number }) {
  const state = useCatalogState()
  if (state.status === 'loading') return <Skeleton lines={lines} />
  if (state.status === 'error') return <ErrorState title="Không tải được dữ liệu nội dung" error={state.error} retry={state.retry} />
  return <>{children(state.catalog)}</>
}
