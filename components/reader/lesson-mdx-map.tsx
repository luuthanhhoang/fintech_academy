import Link from 'next/link'
import type { ReactNode } from 'react'
import type { ContentBundle, Lesson } from '@/lib/content/types'
import { QuizItemCard } from '@/components/quiz/quiz-item'
import { SimulatorFrame } from '@/components/simulators/frame'
import { LabEmbed } from '@/components/lab/lab-embed'
import { DiagramView } from '@/components/learn/diagram'
import { ScenarioPlayer } from '@/components/learn/scenario'
import { Term } from '@/components/learn/term'
import { WorkedExampleBlock } from '@/components/learn/worked-example'
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
          <span className="text-xs text-ink-3">Case study · {cs.period}</span>
          <span className="block font-medium">{cs.title.vi}</span>
          <span className="block text-sm text-ink-2">{cs.summary}</span>
        </Link>
      )
    },
    WorkedExample: ({ id }: { id: string }) => {
      const ex = lesson.examples.find((e) => e.id === id)
      return ex ? <WorkedExampleBlock example={ex} /> : missing('WorkedExample', id)
    },
    Diagram: ({ id }: { id: string }) => {
      const d = lesson.diagrams.find((x) => x.id === id)
      return d ? <DiagramView diagram={d} /> : missing('Diagram', id)
    },
    Scenario: ({ id }: { id: string }) => {
      const sc = bundle.scenarios.find((x) => x.id === id)
      return sc ? <ScenarioPlayer scenario={sc} embedded /> : missing('Scenario', id)
    },
    Term: ({ id, children }: { id: string; children?: ReactNode }) => {
      const c = bundle.concepts.find((x) => x.id === id)
      return c ? <Term concept={{ id: c.id, name: c.name, short: c.short }}>{children}</Term> : missing('Term', id)
    },
    Fact: ({ id }: { id: string }): ReactNode => {
      const fact = lesson.facts.find((f) => f.id === id)
      return fact ? <FactInline fact={fact} source={bundle.sources.find((s) => s.id === fact.sourceId)} /> : missing('Fact', id)
    },
  }
}
