'use client'

import { WithCatalog } from '@/components/data/gate'
import { TodayView } from '@/components/today/today-view'
import { PageTitle } from '@/components/ui/primitives'

export default function TodayPage() {
  return (
    <>
      <PageTitle title="Hôm nay" lead="Một hành trình ngắn mỗi ngày, đi lần lượt từng điểm dừng. Bỏ dở giữa chừng cũng không sao: quay lại là tiếp tục đúng chỗ cũ." />
      <WithCatalog>{(catalog) => <TodayView catalog={catalog} />}</WithCatalog>
    </>
  )
}
