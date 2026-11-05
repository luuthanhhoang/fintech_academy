/** Pure layout for lesson diagrams (SVG coordinates). Sequence: lifelines + rows; flow: dagre DAG layout. */
import dagre from '@dagrejs/dagre'
import type { FlowDiagram, SequenceDiagram } from '../content/schema/learning'

export interface SequenceLayout {
  width: number
  height: number
  actors: { id: string; label: string; x: number }[]
  messages: { index: number; y: number; x1: number; x2: number; label: string; note?: string; self: boolean }[]
  lifelineTop: number
}

export const SEQ = { colWidth: 170, margin: 24, header: 48, rowHeight: 56 } as const

export function layoutSequence(d: SequenceDiagram): SequenceLayout {
  const xOf = new Map(d.actors.map((a, i) => [a.id, SEQ.margin + SEQ.colWidth / 2 + i * SEQ.colWidth]))
  const lifelineTop = SEQ.margin + SEQ.header
  const messages = d.steps.map((s, i) => ({
    index: i,
    y: lifelineTop + SEQ.rowHeight * (i + 0.7),
    x1: xOf.get(s.from) as number,
    x2: xOf.get(s.to) as number,
    label: s.label,
    note: s.note,
    self: s.from === s.to,
  }))
  return {
    width: SEQ.margin * 2 + SEQ.colWidth * d.actors.length,
    height: lifelineTop + SEQ.rowHeight * d.steps.length + SEQ.margin,
    actors: d.actors.map((a) => ({ id: a.id, label: a.label, x: xOf.get(a.id) as number })),
    messages,
    lifelineTop,
  }
}

export interface FlowLayout {
  width: number
  height: number
  nodes: { id: string; label: string; tone: string; x: number; y: number; w: number; h: number }[]
  edges: { from: string; to: string; label?: string; points: { x: number; y: number }[] }[]
}

export const FLOW = { nodeW: 168, nodeH: 52, pad: 20 } as const

export function layoutFlow(d: FlowDiagram): FlowLayout {
  const g = new dagre.graphlib.Graph({ multigraph: true })
  g.setGraph({ rankdir: d.direction, nodesep: 28, ranksep: 56, marginx: FLOW.pad, marginy: FLOW.pad })
  g.setDefaultEdgeLabel(() => ({}))
  for (const n of d.nodes) g.setNode(n.id, { width: FLOW.nodeW, height: FLOW.nodeH })
  d.edges.forEach((e, i) => g.setEdge(e.from, e.to, { label: e.label, width: e.label ? 90 : 0, height: e.label ? 18 : 0 }, String(i)))
  dagre.layout(g)
  const graph = g.graph() as { width?: number; height?: number }
  return {
    width: Math.ceil(graph.width ?? 0),
    height: Math.ceil(graph.height ?? 0),
    nodes: d.nodes.map((n) => {
      const p = g.node(n.id)
      return { id: n.id, label: n.label, tone: n.tone, x: p.x - FLOW.nodeW / 2, y: p.y - FLOW.nodeH / 2, w: FLOW.nodeW, h: FLOW.nodeH }
    }),
    edges: d.edges.map((e, i) => ({ from: e.from, to: e.to, label: e.label, points: (g.edge({ v: e.from, w: e.to, name: String(i) }) as { points: { x: number; y: number }[] }).points })),
  }
}

/** Splits a label into lines of at most `max` characters on word boundaries (SVG has no auto-wrap). */
export function wrapLabel(text: string, max: number): string[] {
  const lines: string[] = []
  let cur = ''
  for (const word of text.split(/\s+/)) {
    if (cur && (cur + ' ' + word).length > max) {
      lines.push(cur)
      cur = word
    } else cur = cur ? `${cur} ${word}` : word
  }
  if (cur) lines.push(cur)
  return lines
}
