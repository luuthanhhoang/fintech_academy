'use client'

import { WithCatalog } from '@/components/data/gate'
import { useMastery } from '@/components/data/use-learner'
import { TransitMap } from '@/components/roadmap/transit-map'
import { Skeleton } from '@/components/ui/states'
import type { Catalog } from '@/lib/content/catalog'
import type { LessonStatus } from '@/lib/roadmap/line'

function Lines({ catalog }: { catalog: Catalog }) {
  const mastery = useMastery(catalog)
  if (mastery.status === 'loading') return <Skeleton lines={12} />
  const progress = new Map<string, LessonStatus>(mastery.records.progress.map((p) => [p.lessonId, p.status]))
  return <TransitMap catalog={catalog} progress={progress} />
}

export function TracksClient() {
  return <WithCatalog>{(catalog) => <Lines catalog={catalog} />}</WithCatalog>
}
