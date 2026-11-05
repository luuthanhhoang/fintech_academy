'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import type { Diagram } from '@/lib/content/schema/learning'
import { layoutFlow, layoutSequence } from '@/lib/diagram/layout'
import { Button } from '@/components/ui/primitives'
import { FlowSvg, SequenceSvg } from './diagram-svg'
import { WhyLink } from './why-link'

const STEP_MS = 1100

/** Data-driven diagram (sequence or flow) with step-by-step playback and a text alternative. */
export function DiagramView({ diagram }: { diagram: Diagram }) {
  const markerId = `arrow-${useId().replace(/:/g, '')}`
  const total = diagram.kind === 'sequence' ? diagram.steps.length : diagram.edges.length
  const [visible, setVisible] = useState(total)
  const [playing, setPlaying] = useState(false)
  const [asText, setAsText] = useState(false)
  const layout = useMemo(() => (diagram.kind === 'sequence' ? layoutSequence(diagram) : layoutFlow(diagram)), [diagram])

  const isPlaying = playing && visible < total
  useEffect(() => {
    if (!isPlaying) return
    const t = window.setTimeout(() => setVisible((v) => v + 1), STEP_MS)
    return () => window.clearTimeout(t)
  }, [isPlaying, visible])

  const steps =
    diagram.kind === 'sequence'
      ? diagram.steps.map((s) => `${diagram.actors.find((a) => a.id === s.from)?.label} → ${diagram.actors.find((a) => a.id === s.to)?.label}: ${s.label}${s.note ? ` (${s.note})` : ''}`)
      : diagram.edges.map((e) => `${diagram.nodes.find((n) => n.id === e.from)?.label} → ${diagram.nodes.find((n) => n.id === e.to)?.label}${e.label ? `: ${e.label}` : ''}`)

  return (
    <figure className="my-8 rounded-xl border border-rule bg-paper font-sans" aria-label={diagram.title}>
      <figcaption className="flex flex-wrap items-center gap-2 border-b border-rule px-4 py-3">
        <span className="text-xs uppercase tracking-wider text-ink-3">Sơ đồ</span>
        <span className="font-medium">{diagram.title}</span>
        <span className="ml-auto"><WhyLink method="dual-coding" /></span>
      </figcaption>
      <div className="flex flex-wrap items-center gap-2 px-4 pt-3">
        <Button variant="primary" onClick={() => (setVisible(0), setPlaying(true))} disabled={isPlaying}>▶ Phát từng bước</Button>
        <Button onClick={() => (setPlaying(false), setVisible((v) => Math.min(total, v + 1)))}>Bước tiếp</Button>
        <Button variant="ghost" onClick={() => (setPlaying(false), setVisible(total))}>Hiện tất cả</Button>
        <span className="num text-xs text-ink-3">{Math.min(visible, total)}/{total}</span>
        <button type="button" onClick={() => setAsText((t) => !t)} className="ml-auto text-xs underline">{asText ? 'Xem sơ đồ' : 'Xem dạng văn bản'}</button>
      </div>
      <div className="overflow-x-auto p-4">
        {asText ? (
          <ol className="list-decimal space-y-1 pl-5 text-sm">{steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
        ) : layout && 'actors' in layout ? (
          <SequenceSvg layout={layout} visible={visible} markerId={markerId} />
        ) : (
          <FlowSvg layout={layout} visible={visible} markerId={markerId} />
        )}
        <ol className="sr-only">{steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
      </div>
      {visible > 0 && visible <= total && !asText && <p role="status" className="px-4 text-sm text-ink-2">Bước {visible}: {steps[visible - 1]}</p>}
      <p className="px-4 pb-3 pt-1 text-sm text-ink-3">{diagram.caption}</p>
    </figure>
  )
}
