import Link from 'next/link'
import type { LearningMethodKey } from '@/lib/registry/keys'

/** Small "why does this work?" link to the evidence on /method. */
export function WhyLink({ method, label = 'Vì sao cách này hiệu quả?' }: { method: LearningMethodKey; label?: string }) {
  return (
    <Link href={`/method/#${method}`} className="inline-flex items-center gap-1 text-xs text-ink-3 underline decoration-dotted underline-offset-2 hover:text-accent">
      <span aria-hidden="true">ⓘ</span>
      {label}
    </Link>
  )
}
