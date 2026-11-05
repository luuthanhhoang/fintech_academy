'use client'

import { WithCatalog } from '@/components/data/gate'
import { ConceptDetail } from '@/components/roadmap/concept-detail'

export function ConceptPageClient({ id }: { id: string }) {
  return <WithCatalog>{(catalog) => <ConceptDetail catalog={catalog} id={id} />}</WithCatalog>
}
