'use client'

import { WithCatalog } from '@/components/data/gate'
import { PracticeSession } from '@/components/practice/practice-session'
import { PageTitle } from '@/components/ui/primitives'

export default function PracticePage() {
  return (
    <>
      <PageTitle eyebrow="Interleaved practice" title="Luyện tập xen kẽ" en="Mixed practice" lead="Các câu hỏi được trộn từ nhiều khái niệm bạn đã học, ưu tiên khái niệm yếu. Phải tự nhận ra 'bài này dùng công thức nào' — kỹ năng mà làm bài theo từng chương không luyện được." />
      <WithCatalog>{(catalog) => <PracticeSession catalog={catalog} />}</WithCatalog>
    </>
  )
}
