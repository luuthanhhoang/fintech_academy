'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { Scenario } from '@/lib/content/schema/learning'
import { logPractice } from '@/lib/db/repos/activity'
import { choose, current, isFinished, qualitySummary, startScenario } from '@/lib/scenario/engine'
import { Button } from '@/components/ui/primitives'
import { WhyLink } from './why-link'

const QUALITY = { good: { label: 'Hợp lý', cls: 'border-good bg-good-soft' }, risky: { label: 'Rủi ro', cls: 'border-warn bg-warn-soft' }, bad: { label: 'Sai lầm', cls: 'border-bad bg-bad-soft' } } as const
const VERDICT = { good: 'Kết cục tốt', mixed: 'Kết cục lẫn lộn', bad: 'Kết cục xấu' } as const
const RESULT = { good: 'passed', mixed: 'done', bad: 'failed' } as const

/** Branching role-play: decisions → consequences → debrief. Always labelled as a hypothetical. */
export function ScenarioPlayer({ scenario, embedded = false }: { scenario: Scenario; embedded?: boolean }) {
  const [state, setState] = useState(() => startScenario(scenario))
  const node = current(state)
  const finished = isFinished(state)
  const pick = (choiceId: string) => {
    const next = choose(scenario, state, choiceId)
    setState(next)
    const end = current(next).ending
    if (end) void logPractice({ kind: 'scenario', refId: scenario.id, conceptIds: scenario.concepts, result: RESULT[end.verdict], detail: end.verdict })
  }
  const summary = qualitySummary(state)
  return (
    <figure className="my-8 rounded-xl border border-rule bg-paper font-sans">
      <figcaption className="flex flex-wrap items-center gap-2 border-b border-rule px-4 py-3">
        <span className="text-xs uppercase tracking-wider text-ink-3">Tình huống nhập vai</span>
        <span className="font-medium">{scenario.title.vi}</span>
        <span className="rounded border border-warn bg-warn-soft px-1.5 py-0.5 text-[0.7rem] text-warn" title={scenario.hypotheticalNote}>◇ Tình huống giả định</span>
        {embedded && <Link href={`/scenarios/${scenario.id}/`} className="ml-auto text-xs text-accent underline">Mở toàn trang</Link>}
      </figcaption>
      <div className="space-y-4 p-4">
        <p className="text-sm text-ink-2"><span className="font-medium text-ink">Vai của bạn:</span> {scenario.role}</p>
        {state.path.slice(0, -1).map((st, i) => (
          <div key={i} className="space-y-2 border-l-2 border-rule pl-3 text-sm">
            <p className="text-ink-2">{st.node.text}</p>
            {st.choice && (
              <div className={`rounded-md border p-2 ${QUALITY[st.choice.quality].cls}`}>
                <p className="font-medium">Bạn chọn: {st.choice.label} <span className="text-xs">· {QUALITY[st.choice.quality].label}</span></p>
                <p className="mt-1">{st.choice.feedback}</p>
              </div>
            )}
          </div>
        ))}
        <div className="rounded-lg bg-paper-2 p-3">
          <p className="whitespace-pre-line">{node.text}</p>
          {node.choices && (
            <div className="mt-3 grid gap-2">
              {node.choices.map((c) => (
                <button key={c.id} type="button" onClick={() => pick(c.id)} className="rounded-md border border-rule bg-paper px-3 py-2 text-left text-sm hover:border-accent hover:bg-accent-soft">
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {finished && node.ending && (
          <div role="status" className="rounded-lg border border-accent p-3">
            <p className="font-serif text-lg font-semibold">{VERDICT[node.ending.verdict]}</p>
            <p className="num mt-1 text-xs text-ink-3">Lựa chọn hợp lý {summary.good} · rủi ro {summary.risky} · sai lầm {summary.bad}</p>
            <p className="mt-2 whitespace-pre-line text-sm">{node.ending.debrief}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button onClick={() => setState(startScenario(scenario))}>Chơi lại nhánh khác</Button>
              {scenario.relatedCase && <Link href={`/cases/${scenario.relatedCase}/`} className="text-sm text-accent underline">Đối chiếu sự cố thật →</Link>}
              <WhyLink method="scenario-practice" />
            </div>
          </div>
        )}
        <p className="text-xs text-ink-3">{scenario.hypotheticalNote}</p>
      </div>
    </figure>
  )
}
