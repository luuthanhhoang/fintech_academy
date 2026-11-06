'use client'

import type { QuizItem } from '@/lib/content/schema/quiz'
import { QuizItemCard } from '@/components/quiz/quiz-item'
import { WhyLink } from './why-link'

/** "Warm-up: guess first" — pretest items answered before reading; never counted toward mastery. */
export function PretestBlock({ lessonId, items }: { lessonId: string; items: QuizItem[] }) {
  return (
    <section aria-labelledby="khoi-dong" className="mb-10 rounded-xl border border-dashed border-accent bg-accent-soft/40 p-4 font-sans sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="khoi-dong" className="font-display text-xl font-semibold">Khởi động: đoán trước khi đọc</h2>
        <WhyLink method="pretesting" />
      </div>
      <p className="mt-1 text-sm text-ink-2">Chưa học thì cứ đoán — sai cũng không sao, câu này không tính điểm. Đoán trước giúp bạn đọc bài có chủ đích; cuối bài bạn sẽ gặp lại câu này.</p>
      <div className="mt-4 space-y-3">
        {items.map((q, i) => (
          <QuizItemCard key={q.id} item={q} lessonId={lessonId} context="pretest" index={i} />
        ))}
      </div>
    </section>
  )
}
