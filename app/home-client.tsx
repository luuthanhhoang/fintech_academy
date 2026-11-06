'use client'

import { WithCatalog } from '@/components/data/gate'
import { HomeView } from '@/components/home/home-view'

export function HomeClient() {
  return <WithCatalog>{(catalog) => <HomeView catalog={catalog} />}</WithCatalog>
}
