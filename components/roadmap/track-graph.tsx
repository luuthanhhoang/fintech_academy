'use client'

import dagre from '@dagrejs/dagre'
import { Background, Controls, MarkerType, Position, ReactFlow, type Edge, type Node } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import type { Catalog } from '@/lib/content/catalog'
import type { ConceptScore } from '@/lib/mastery/score'
import type { ConceptState } from '@/lib/mastery/state'
import { fmtPct } from '@/lib/util/format'
import { STATE_STYLE } from './state-style'

const W = 190
const H = 52

/** Concept DAG auto-generated from prerequisites; prerequisites outside the selected stage appear as faded external nodes. */
export function TrackGraph({ catalog, trackId, states, scores }: { catalog: Catalog; trackId: string; states: Map<string, ConceptState>; scores: Map<string, ConceptScore> }) {
  const router = useRouter()
  const track = catalog.tracks.find((t) => t.id === trackId)
  const stages = [...(track?.stages ?? [])].sort((a, b) => a.order - b.order)
  const [stageId, setStageId] = useState<string>(stages[0]?.id ?? 'all')
  const { nodes, edges } = useMemo(() => {
    const own = catalog.concepts.filter((c) => c.track === trackId && (stageId === 'all' || c.stage === stageId))
    const ownIds = new Set(own.map((c) => c.id))
    const external = catalog.concepts.filter((c) => !ownIds.has(c.id) && own.some((o) => o.prerequisites.includes(c.id)))
    const all = [...own, ...external]
    const g = new dagre.graphlib.Graph()
    g.setGraph({ rankdir: 'LR', nodesep: 22, ranksep: 80 })
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
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: { label: `${STATE_STYLE[state].glyph} ${c.name.vi}${s !== null && s !== undefined ? ` · ${fmtPct(s, 0)}` : ''}` },
        style: { width: W, fontSize: 13, borderRadius: 8, border: `1.5px ${ext ? 'dashed' : 'solid'} ${STATE_STYLE[state].border}`, background: 'var(--paper)', color: 'var(--ink)', opacity: ext ? 0.6 : 1 },
        className: STATE_STYLE[state].cls,
      }
    })
    return { nodes: ns, edges: es }
  }, [catalog, trackId, stageId, states, scores])

  return (
    <div>
    <label className="mb-3 flex items-center gap-2 text-sm">
      Chặng
      <select value={stageId} onChange={(e) => setStageId(e.target.value)} className="rounded-md border border-rule bg-paper px-2 py-1">
        {stages.map((s) => <option key={s.id} value={s.id}>{s.order}. {s.title.vi}</option>)}
        <option value="all">Toàn bộ lộ trình</option>
      </select>
    </label>
    <div className="h-[70vh] rounded-lg border border-rule" aria-label="Đồ thị khái niệm và tiền đề">
      <ReactFlow key={stageId} nodes={nodes} edges={edges} fitView fitViewOptions={{ maxZoom: 1.1 }} nodesDraggable={false} nodesConnectable={false} onNodeClick={(_, n) => router.push(`/concepts/${n.id}/`)} proOptions={{ hideAttribution: true }}>
        <Background color="var(--chart-grid)" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
      <p className="mt-2 text-xs text-ink-3">Mũi tên: tiền đề → khái niệm. Khung nét đứt: tiền đề nằm ngoài chặng (hoặc lộ trình) đang xem. Bấm một nút để mở khái niệm.</p>
    </div>
  )
}
