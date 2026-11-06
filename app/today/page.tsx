'use client'

import { WithCatalog } from '@/components/data/gate'
import { TodayView } from '@/components/today/today-view'
import { PageTitle } from '@/components/ui/primitives'

export default function TodayPage() {
  return (
    <>
      <PageTitle eyebrow="Vòng lặp hằng ngày" title="Hôm nay" en="Today" lead="Ôn thẻ đến hạn → học bài kế tiếp → thực hành → mini case → tự giải thích. Tiến độ trong ngày được lưu lại, quay lại lúc nào cũng tiếp tục được." />
      <WithCatalog>{(catalog) => <TodayView catalog={catalog} />}</WithCatalog>
    </>
  )
}
