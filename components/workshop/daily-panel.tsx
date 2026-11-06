'use client'

import Link from 'next/link'
import { useDueCards } from '@/components/data/use-learner'
import { Icon } from '@/components/ui/icons'

interface Habit { title: string; desc: string; href: string; icon: string }

/** The two daily habits, side by side, with today's real count of due cards. */
export function DailyPanel({ review, practice }: { review: Habit; practice: Habit }) {
  const due = useDueCards()
  const count = due?.length
  return (
    <div className="grid gap-4 md:grid-cols-[1.3fr_1fr]">
      <Link href={review.href} className="group rounded-3xl bg-ink p-6 text-card sm:p-8">
        <p className="num font-display text-5xl font-bold">{count === undefined ? '…' : count}</p>
        <p className="mt-1 text-card/80">{count === 0 ? 'thẻ đến hạn — hôm nay bạn đã ôn đủ' : 'thẻ đến hạn hôm nay'}</p>
        <h2 className="mt-6 flex items-center gap-2 font-display text-2xl font-bold group-hover:underline">
          <Icon name={review.icon} width={22} height={22} />
          {review.title}
        </h2>
        <p className="mt-1 max-w-[45ch] text-card/80">{review.desc}</p>
      </Link>
      <Link href={practice.href} className="group rounded-3xl bg-card p-6 ring-1 ring-rule/70 sm:p-8">
        <h2 className="flex items-center gap-2 font-display text-2xl font-bold group-hover:underline">
          <Icon name={practice.icon} width={22} height={22} className="text-accent" />
          {practice.title}
        </h2>
        <p className="mt-1 max-w-[45ch] text-ink-2">{practice.desc}</p>
        <span className="mt-6 inline-flex rounded-full border border-rule px-4 py-2 text-sm font-medium">Bắt đầu một lượt</span>
      </Link>
    </div>
  )
}
