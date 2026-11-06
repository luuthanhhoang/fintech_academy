'use client'

import Link from 'next/link'

import { WithCatalog } from '@/components/data/gate'
import { ReviewSession } from '@/components/review/review-session'
import { WhyLink } from '@/components/learn/why-link'
import { PageTitle } from '@/components/ui/primitives'

export default function ReviewPage() {
  return (
    <>
      <PageTitle eyebrow={<Link href="/workshop/" className="hover:underline">← Thực hành</Link>} title="Ôn thẻ đến hạn" lead="Mỗi thẻ quay lại đúng lúc bạn sắp quên (lịch FSRS). Thẻ khái niệm: tự nhớ lại rồi tự chấm. Thẻ câu hỏi: làm lại câu từng sai." />
      <div className="-mt-4 mb-6 font-sans"><WhyLink method="spaced-repetition" /></div>
      <WithCatalog>{(catalog) => <ReviewSession catalog={catalog} />}</WithCatalog>
    </>
  )
}
