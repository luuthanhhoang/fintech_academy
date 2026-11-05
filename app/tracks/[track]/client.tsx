'use client'

import { WithCatalog } from '@/components/data/gate'
import { TrackView } from '@/components/roadmap/track-view'

export function TrackPageClient({ trackId }: { trackId: string }) {
  return <WithCatalog>{(catalog) => <TrackView catalog={catalog} trackId={trackId} />}</WithCatalog>
}
