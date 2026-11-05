import type { FlowLayout, SequenceLayout } from '@/lib/diagram/layout'
import { FLOW, wrapLabel } from '@/lib/diagram/layout'

const TONE: Record<string, { fill: string; stroke: string }> = {
  default: { fill: 'var(--paper)', stroke: 'var(--ink-3)' },
  accent: { fill: 'var(--accent-soft)', stroke: 'var(--accent)' },
  warn: { fill: 'var(--warn-soft)', stroke: 'var(--warn)' },
  good: { fill: 'var(--good-soft)', stroke: 'var(--good)' },
}

function Lines({ x, y, lines, size = 12, anchor = 'middle' }: { x: number; y: number; lines: string[]; size?: number; anchor?: 'middle' | 'start' }) {
  const top = y - ((lines.length - 1) * (size + 3)) / 2
  return (
    <text x={x} textAnchor={anchor} fontSize={size} fill="var(--ink)" fontFamily="var(--font-sans)" stroke="var(--paper)" strokeWidth={4} strokeLinejoin="round" paintOrder="stroke">
      {lines.map((l, i) => (
        <tspan key={i} x={x} y={top + i * (size + 3)} dominantBaseline="middle">{l}</tspan>
      ))}
    </text>
  )
}

/** Scale to the container on wide screens; keep a readable minimum width (scrolls on phones). */
const MIN_READABLE = 560
const fit = (w: number) => ({ width: '100%', minWidth: Math.min(w, MIN_READABLE), maxWidth: w, height: 'auto' })

export function Arrowhead({ id }: { id: string }) {
  return (
    <defs>
      <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="var(--ink-2)" />
      </marker>
    </defs>
  )
}

export function SequenceSvg({ layout, visible, markerId }: { layout: SequenceLayout; visible: number; markerId: string }) {
  const bottom = layout.height - 12
  return (
    <svg viewBox={`0 0 ${layout.width} ${layout.height}`} style={fit(layout.width)} aria-hidden="true">
      <Arrowhead id={markerId} />
      {layout.actors.map((a) => (
        <g key={a.id}>
          <rect x={a.x - 74} y={14} width={148} height={40} rx={8} fill="var(--paper-2)" stroke="var(--rule)" />
          <Lines x={a.x} y={34} lines={wrapLabel(a.label, 20)} />
          <line x1={a.x} x2={a.x} y1={layout.lifelineTop} y2={bottom} stroke="var(--rule)" strokeDasharray="4 4" />
        </g>
      ))}
      {layout.messages.map((m) => {
        const on = m.index < visible
        const op = on ? 1 : 0.12
        if (m.self) {
          const d = `M${m.x1},${m.y - 10} h34 v20 h-32`
          return (
            <g key={m.index} opacity={op}>
              <path d={d} fill="none" stroke="var(--ink-2)" strokeWidth={1.5} markerEnd={`url(#${markerId})`} />
              <Lines x={m.x1 + 42} y={m.y} lines={wrapLabel(`${m.index + 1}. ${m.label}`, 26)} size={11} anchor="start" />
            </g>
          )
        }
        const mid = (m.x1 + m.x2) / 2
        return (
          <g key={m.index} opacity={op}>
            <line x1={m.x1} x2={m.x2 + (m.x2 > m.x1 ? -3 : 3)} y1={m.y} y2={m.y} stroke={on ? 'var(--accent)' : 'var(--ink-3)'} strokeWidth={1.75} markerEnd={`url(#${markerId})`} />
            <Lines x={mid} y={m.y - 13} lines={wrapLabel(`${m.index + 1}. ${m.label}`, Math.max(14, Math.abs(m.x2 - m.x1) / 7))} size={11} />
          </g>
        )
      })}
    </svg>
  )
}

export function FlowSvg({ layout, visible, markerId }: { layout: FlowLayout; visible: number; markerId: string }) {
  const shownNodes = new Set<string>()
  layout.edges.slice(0, visible).forEach((e) => (shownNodes.add(e.from), shownNodes.add(e.to)))
  if (visible > 0 && layout.edges[0]) shownNodes.add(layout.edges[0].from)
  return (
    <svg viewBox={`0 0 ${layout.width} ${layout.height}`} style={fit(layout.width)} aria-hidden="true">
      <Arrowhead id={markerId} />
      {layout.edges.map((e, i) => {
        const pts = e.points.map((p) => `${p.x},${p.y}`).join(' ')
        const mid = e.points[Math.floor(e.points.length / 2)] ?? { x: 0, y: 0 }
        return (
          <g key={i} opacity={i < visible ? 1 : 0.12}>
            <polyline points={pts} fill="none" stroke="var(--ink-2)" strokeWidth={1.5} markerEnd={`url(#${markerId})`} />
            {e.label && <Lines x={mid.x} y={mid.y - 9} lines={wrapLabel(e.label, 18)} size={11} />}
          </g>
        )
      })}
      {layout.nodes.map((n) => {
        const t = TONE[n.tone] ?? (TONE.default as { fill: string; stroke: string })
        return (
          <g key={n.id} opacity={shownNodes.has(n.id) || visible >= layout.edges.length ? 1 : 0.25}>
            <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={10} fill={t.fill} stroke={t.stroke} strokeWidth={1.5} />
            <Lines x={n.x + FLOW.nodeW / 2} y={n.y + FLOW.nodeH / 2} lines={wrapLabel(n.label, 22)} />
          </g>
        )
      })}
    </svg>
  )
}
