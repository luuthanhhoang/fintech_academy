'use client'

import dagre from '@dagrejs/dagre'
import { Background, Controls, MarkerType, ReactFlow, type Edge, type Node } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import type { Catalog } from '@/lib/content/catalog'
import type { ConceptScore } from '@/lib/mastery/score'
import type { ConceptState } from '@/lib/mastery/state'
import { fmtPct } from '@/lib/util/format'
import { STATE_STYLE } from './state-style'

const W = 190
const H = 52

/** Concept DAG auto-generated from prerequisites; cross-track prerequisites appear as faded external nodes. */
export function TrackGraph({ catalog, trackId, states, scores }: { catalog: Catalog; trackId: string; states: Map<string, ConceptState>; scores: Map<string, ConceptScore> }) {
  const router = useRouter()
  const { nodes, edges } = useMemo(() => {
    const own = catalog.concepts.filter((c) => c.track === trackId)
    const ownIds = new Set(own.map((c) => c.id))
    const external = catalog.concepts.filter((c) => !ownIds.has(c.id) && own.some((o) => o.prerequisites.includes(c.id)))
    const all = [...own, ...external]
    const g = new dagre.graphlib.Graph()
    g.setGraph({ rankdir: 'LR', nodesep: 18, ranksep: 70 })
    g.setDefaultEdgeLabel(() => ({}))
    all.forEach((c) => g.setNode(c.id, { width: W, height: H }))
    const es: Edge[] = []
    own.forEach((c) =>
      c.prerequisites.forEach((p) => {
        g.setEdge(p, c.id)
        es.push({ id: `${p}->${c.id}`, source: p, target: c.id, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: 'var(--ink-3)' } })
      }),
    )
    dagre.layout(g)
    const ns: Node[] = all.map((c) => {
      const pos = g.node(c.id)
      const state = states.get(c.id) ?? 'planned'
      const s = scores.get(c.id)?.score
      const ext = !ownIds.has(c.id)
      return {
        id: c.id,
        position: { x: pos.x - W / 2, y: pos.y - H / 2 },
        data: { label: `${STATE_STYLE[state].glyph} ${c.name.vi}${s !== null && s !== undefined ? ` · ${fmtPct(s, 0)}` : ''}` },
        style: { width: W, fontSize: 12, borderRadius: 8, border: `1.5px ${ext ? 'dashed' : 'solid'} ${STATE_STYLE[state].border}`, background: 'var(--paper)', color: 'var(--ink)', opacity: ext ? 0.6 : 1 },
        className: STATE_STYLE[state].cls,
      }
    })
    return { nodes: ns, edges: es }
  }, [catalog, trackId, states, scores])

  return (
    <div className="h-[70vh] rounded-lg border border-rule" aria-label="Đồ thị khái niệm và tiền đề">
      <ReactFlow nodes={nodes} edges={edges} fitView nodesDraggable={false} nodesConnectable={false} onNodeClick={(_, n) => router.push(`/concepts/${n.id}/`)} proOptions={{ hideAttribution: true }}>
        <Background color="var(--chart-grid)" />
        <Controls showInteractive={false} />
      </ReactFlow>
      <p className="mt-2 text-xs text-ink-3">Mũi tên: tiền đề → khái niệm. Khung nét đứt: tiền đề thuộc lộ trình khác. Bấm một nút để mở khái niệm.</p>
    </div>
  )
}
