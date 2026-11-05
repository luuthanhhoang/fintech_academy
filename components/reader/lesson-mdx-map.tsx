import Link from 'next/link'
import type { ReactNode } from 'react'
import type { ContentBundle, Lesson } from '@/lib/content/types'
import { QuizItemCard } from '@/components/quiz/quiz-item'
import { SimulatorFrame } from '@/components/simulators/frame'
import { LabEmbed } from '@/components/lab/lab-embed'
import { ErrorState } from '@/components/ui/states'
import { Callout, Figure, Sidenote } from './blocks'
import { FactInline } from './fact'

/**
 * Component map for one lesson's MDX. Each embed resolves its `id` against content that the
 * validator has already checked, so a missing id here can only mean a stale build.
 */
export function lessonComponents(lesson: Lesson, bundle: ContentBundle) {
  const missing = (what: string, id: string) => <ErrorState error={`${what} "${id}" không tồn tại`} />
  return {
    Callout,
    Sidenote,
    Figure,
    Simulator: ({ id }: { id: string }) => {
      const meta = bundle.simulators.find((s) => s.id === id)
      return meta ? <SimulatorFrame meta={meta} syntheticLabel={bundle.config.site.syntheticLabel} embedded /> : missing('Simulator', id)
    },
    Quiz: ({ id }: { id: string }) => {
      const item = lesson.quiz.find((q) => q.id === id)
      return item ? <div className="my-6"><QuizItemCard item={item} lessonId={lesson.id} context="lesson" /></div> : missing('Quiz', id)
    },
    Lab: ({ id }: { id: string }) => {
      const lab = bundle.labs.find((l) => l.id === id)
      return lab ? <LabEmbed lab={lab} /> : missing('Lab', id)
    },
    Case: ({ id }: { id: string }) => {
      const cs = bundle.cases.find((c) => c.id === id)
      if (!cs) return missing('Case', id)
      return (
        <Link href={`/cases/${cs.id}/`} className="my-6 block rounded-lg border border-rule p-4 font-sans hover:bg-paper-2">
          <span className="text-xs uppercase tracking-wider text-ink-3">Case study · {cs.period}</span>
          <span className="block font-medium">{cs.title.vi}</span>
          <span className="block text-sm text-ink-2">{cs.summary}</span>
        </Link>
      )
    },
    Fact: ({ id }: { id: string }): ReactNode => {
      const fact = lesson.facts.find((f) => f.id === id)
      return fact ? <FactInline fact={fact} source={bundle.sources.find((s) => s.id === fact.sourceId)} /> : missing('Fact', id)
    },
  }
}
