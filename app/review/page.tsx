'use client'

import { WithCatalog } from '@/components/data/gate'
import { ReviewSession } from '@/components/review/review-session'
import { WhyLink } from '@/components/learn/why-link'
import { PageTitle } from '@/components/ui/primitives'

export default function ReviewPage() {
  return (
    <>
      <PageTitle eyebrow="Spaced repetition (FSRS)" title="Ôn tập" en="Review" lead="Thẻ đến hạn theo lịch FSRS. Thẻ khái niệm: tự nhớ rồi tự chấm; thẻ quiz: làm lại câu đã sai." />
      <div className="-mt-4 mb-6 font-sans"><WhyLink method="spaced-repetition" /></div>
      <WithCatalog>{(catalog) => <ReviewSession catalog={catalog} />}</WithCatalog>
    </>
  )
}
