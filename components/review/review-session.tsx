'use client'

import { useState } from 'react'
import type { Catalog } from '@/lib/content/catalog'
import { useDueCards } from '@/components/data/use-learner'
import { LinkButton } from '@/components/ui/primitives'
import { EmptyState, Skeleton } from '@/components/ui/states'
import { ReviewCard } from './review-card'

/** Runs through due cards (up to `limit`). The queue re-queries live, so reviewed cards drop out. */
export function ReviewSession({ catalog, limit, onFinished }: { catalog: Catalog; limit?: number; onFinished?: () => void }) {
  const due = useDueCards()
  const [done, setDone] = useState(0)
  if (due === undefined) return <Skeleton lines={4} />
  const max = limit ?? catalog.config.today.maxReviews
  const remaining = Math.max(0, Math.min(due.length, max - done))
  const card = remaining > 0 ? due[0] : undefined
  if (!card) {
    return (
      <EmptyState title={done > 0 ? `Xong! Đã ôn ${done} thẻ.` : 'Không có thẻ nào đến hạn.'} action={<LinkButton href="/tracks/">Học bài mới</LinkButton>}>
        Thẻ được tạo khi bạn hoàn thành bài, đánh dấu khái niệm, hoặc trả lời sai quiz.
      </EmptyState>
    )
  }
  return (
    <div>
      <p className="num mb-3 font-sans text-sm text-ink-3">Còn {remaining} thẻ · đã ôn {done}</p>
      <ReviewCard
        key={card.id + done}
        catalog={catalog}
        card={card}
        onDone={() => {
          setDone((d) => d + 1)
          if (remaining <= 1) onFinished?.()
        }}
      />
    </div>
  )
}
