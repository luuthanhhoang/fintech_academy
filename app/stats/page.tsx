'use client'

import { WithCatalog } from '@/components/data/gate'
import { StatsView } from '@/components/stats/stats-view'
import { PageTitle } from '@/components/ui/primitives'

export default function StatsPage() {
  return (
    <>
      <PageTitle eyebrow="Từ dữ liệu thật trên trình duyệt này" title="Thống kê" en="Stats" />
      <WithCatalog>{(catalog) => <StatsView catalog={catalog} />}</WithCatalog>
    </>
  )
}
