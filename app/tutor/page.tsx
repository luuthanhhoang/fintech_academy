'use client'

import { Suspense } from 'react'
import { WithCatalog } from '@/components/data/gate'
import { TutorChat } from '@/components/tutor/tutor-chat'
import { PageTitle } from '@/components/ui/primitives'

export default function TutorPage() {
  return (
    <>
      <PageTitle eyebrow="Dùng khoá API của bạn, chỉ trả lời dựa trên nội dung site" title="Gia sư AI" lead="Hỏi đáp có trích dẫn, Socratic, bài tập theo điểm yếu, chấm tự giải thích. Không đủ căn cứ thì gia sư nói không biết." />
      <Suspense>
        <WithCatalog>{(catalog) => <TutorChat catalog={catalog} />}</WithCatalog>
      </Suspense>
    </>
  )
}
