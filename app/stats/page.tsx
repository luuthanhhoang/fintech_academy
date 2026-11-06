'use client'

import { WithCatalog } from '@/components/data/gate'
import { StatsView } from '@/components/stats/stats-view'
import { PageTitle } from '@/components/ui/primitives'

export default function StatsPage() {
  return (
    <>
      <PageTitle eyebrow="Của bạn" title="Tiến độ" lead="Mọi con số ở đây tính từ chính hoạt động học của bạn, lưu ngay trên trình duyệt này." />
      <WithCatalog>{(catalog) => <StatsView catalog={catalog} />}</WithCatalog>
    </>
  )
}
