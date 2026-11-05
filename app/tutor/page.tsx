'use client'

import { WithCatalog } from '@/components/data/gate'
import { TutorChat } from '@/components/tutor/tutor-chat'
import { PageTitle } from '@/components/ui/primitives'

export default function TutorPage() {
  return (
    <>
      <PageTitle eyebrow="BYOK · chỉ dựa trên nội dung site" title="Gia sư AI" en="AI tutor" lead="Hỏi đáp có trích dẫn, Socratic, bài tập theo điểm yếu, chấm tự giải thích. Không đủ căn cứ thì gia sư nói không biết." />
      <WithCatalog>{(catalog) => <TutorChat catalog={catalog} />}</WithCatalog>
    </>
  )
}
