'use client'

import { useState, type ReactNode } from 'react'
import type { ExampleStep } from '@/lib/content/schema/learning'
import { withinTolerance } from '@/lib/quiz/grade'
import { logPractice } from '@/lib/db/repos/activity'
import { Button } from '@/components/ui/primitives'
import { WhyLink } from './why-link'

export interface RenderedStep extends Omit<ExampleStep, 'text'> {
  body: ReactNode
}

function FadedInput({ step, onSolved }: { step: RenderedStep; onSolved: (how: 'solved' | 'revealed') => void }) {
  const [value, setValue] = useState('')
  const [wrong, setWrong] = useState(false)
  const check = () => {
    const ok = step.tolerance && step.answer !== undefined && withinTolerance(Number(value), step.answer, step.tolerance.kind, step.tolerance.value)
    if (ok) onSolved('solved')
    else setWrong(true)
  }
  return (
    <div className="rounded-md border border-dashed border-accent p-3">
      <p className="text-sm font-medium">✎ {step.prompt}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input type="number" inputMode="decimal" step="any" value={value} onChange={(e) => (setValue(e.target.value), setWrong(false))} aria-label={step.prompt} className="num w-40 rounded border border-rule bg-paper px-2 py-1" />
        {step.unit && <span className="text-sm text-ink-3">{step.unit}</span>}
        <Button variant="primary" onClick={check} disabled={value === ''}>Kiểm tra</Button>
        <Button variant="ghost" onClick={() => onSolved('revealed')}>Xem bước này</Button>
      </div>
      {wrong && <p role="alert" className="mt-1 text-xs text-bad">Chưa đúng — thử lại hoặc xem lại bước trước.</p>}
    </div>
  )
}

/** Worked example with faded steps: steps open one at a time; faded steps must be computed by the learner first. */
export function WorkedExampleView({ id, conceptId, title, problem, steps, takeaway }: { id: string; conceptId: string; title: string; problem: ReactNode; steps: RenderedStep[]; takeaway: ReactNode }) {
  const [shown, setShown] = useState(0)
  const [outcomes, setOutcomes] = useState<('solved' | 'revealed' | 'read')[]>([])
  const done = shown >= steps.length
  const next = steps[shown]
  const advance = (how: 'solved' | 'revealed' | 'read') => {
    const o = [...outcomes, how]
    setOutcomes(o)
    setShown((s) => s + 1)
    if (shown + 1 >= steps.length) {
      const solved = o.filter((x) => x === 'solved').length
      const faded = steps.filter((s) => s.faded).length
      void logPractice({ kind: 'exercise', refId: id, conceptIds: [conceptId], result: solved === faded ? 'passed' : 'done', detail: `${solved}/${faded} bước tự giải` })
    }
  }
  return (
    <figure className="my-8 rounded-xl border border-rule bg-paper font-sans">
      <figcaption className="flex flex-wrap items-center gap-2 border-b border-rule px-4 py-3">
        <span className="text-xs uppercase tracking-wider text-ink-3">Ví dụ mẫu từng bước</span>
        <span className="font-medium">{title}</span>
        <span className="ml-auto"><WhyLink method="worked-examples" /></span>
      </figcaption>
      <div className="p-4">
        <div className="prose-notebook text-base [&>p]:my-1">{problem}</div>
        <ol className="mt-4 space-y-3">
          {steps.slice(0, shown).map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className={`num mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${outcomes[i] === 'solved' ? 'bg-good-soft text-good' : 'bg-paper-2 text-ink-2'}`}>{i + 1}</span>
              <div className="prose-notebook min-w-0 flex-1 text-base [&>p]:my-0.5">{s.body}</div>
            </li>
          ))}
        </ol>
        {next && (
          <div className="mt-3">
            {next.faded ? <FadedInput key={shown} step={next} onSolved={advance} /> : <Button onClick={() => advance('read')}>Bước {shown + 1} →</Button>}
          </div>
        )}
        {done && (
          <div className="mt-4 rounded-md bg-accent-soft p-3 text-sm">
            <p className="font-medium">Điều rút ra</p>
            <div className="prose-notebook text-base [&>p]:my-0.5">{takeaway}</div>
            <button type="button" onClick={() => (setShown(0), setOutcomes([]))} className="mt-2 text-xs underline">Làm lại từ đầu</button>
          </div>
        )}
      </div>
    </figure>
  )
}
