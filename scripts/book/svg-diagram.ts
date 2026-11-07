/** Print-oriented SVG for lesson diagrams (sequence + flow). Greyscale-friendly, Times text, measured line wrapping. */
import { layoutFlow, wrapLabel } from '../../lib/diagram/layout'
import type { Diagram, FlowDiagram, SequenceDiagram } from '../../lib/content/schema/learning'
import { esc } from './util'

const W = 610
const FONT = `font-family="'Times New Roman','Liberation Serif',serif"`
const CHAR = 5.1 // average glyph width at 11px

const TONE: Record<string, { fill: string; stroke: string }> = {
  default: { fill: '#ffffff', stroke: '#444444' },
  accent: { fill: '#e3ecf5', stroke: '#2f6690' },
  warn: { fill: '#f7e8d3', stroke: '#a8611b' },
  good: { fill: '#e0f0e3', stroke: '#2f7a46' },
}

const DEFS = `<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#222"/></marker></defs>`

function textLines(x: number, yTop: number, lines: string[], opts: { size?: number; anchor?: string; bold?: boolean; lh?: number } = {}): string {
  const size = opts.size ?? 11
  const lh = opts.lh ?? 13
  const tspans = lines.map((l, i) => `<tspan x="${x}" y="${(yTop + i * lh).toFixed(1)}">${esc(l)}</tspan>`).join('')
  return `<text ${FONT} font-size="${size}" text-anchor="${opts.anchor ?? 'middle'}"${opts.bold ? ' font-weight="bold"' : ''} fill="#111" stroke="#fff" stroke-width="3.2" paint-order="stroke" stroke-linejoin="round" dominant-baseline="hanging">${tspans}</text>`
}

const charsFor = (width: number): number => Math.max(8, Math.floor(width / CHAR))

export function sequenceSvg(d: SequenceDiagram): string {
  const n = d.actors.length
  const col = (W - 16) / n
  const xs = new Map(d.actors.map((a, i) => [a.id, 8 + col * (i + 0.5)]))
  const headerLines = d.actors.map((a) => wrapLabel(a.label, charsFor(col - 18)))
  const headerH = 14 + Math.max(...headerLines.map((l) => l.length)) * 13
  let y = headerH + 16
  const parts: string[] = []
  d.steps.forEach((s, i) => {
    const x1 = xs.get(s.from) as number
    const x2 = xs.get(s.to) as number
    const self = s.from === s.to
    const label = `${i + 1}. ${s.label}${s.note ? ` (${s.note})` : ''}`
    const leftSide = self && x1 > W * 0.6
    const room = leftSide ? x1 - 40 : W - x1 - 40
    const span = self ? Math.min(col * 0.8, room) : Math.abs(x2 - x1)
    const lines = wrapLabel(label, charsFor(span - 6))
    const h = lines.length * 13 + 14
    if (self) {
      const ay = y + 8
      if (leftSide) {
        parts.push(`<path d="M${x1},${ay - 8} h-26 v16 h24" fill="none" stroke="#222" stroke-width="1.3" marker-end="url(#ah)"/>`)
        parts.push(textLines(x1 - 32, ay - 8, lines, { anchor: 'end' }))
      } else {
        parts.push(`<path d="M${x1},${ay - 8} h26 v16 h-24" fill="none" stroke="#222" stroke-width="1.3" marker-end="url(#ah)"/>`)
        parts.push(textLines(x1 + 32, ay - 8, lines, { anchor: 'start' }))
      }
      y += Math.max(h, 30)
    } else {
      const ay = y + lines.length * 13 + 9
      const dx = x2 > x1 ? -3 : 3
      parts.push(`<line x1="${x1}" y1="${ay}" x2="${x2 + dx}" y2="${ay}" stroke="#222" stroke-width="1.4" marker-end="url(#ah)"/>`)
      parts.push(textLines((x1 + x2) / 2, y, lines))
      y += h + 3
    }
  })
  const H = y + 10
  const life = d.actors
    .map((a) => `<line x1="${xs.get(a.id)}" x2="${xs.get(a.id)}" y1="${headerH + 4}" y2="${H - 6}" stroke="#999" stroke-dasharray="3 3"/>`)
    .join('')
  const heads = d.actors
    .map((a, i) => {
      const x = xs.get(a.id) as number
      const lines = headerLines[i] as string[]
      return `<rect x="${(x - col / 2 + 4).toFixed(1)}" y="3" width="${(col - 8).toFixed(1)}" height="${headerH}" rx="4" fill="#eeeeee" stroke="#555"/>` + textLines(x, 3 + (headerH - lines.length * 13) / 2 + 1, lines, { bold: true })
    })
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H.toFixed(0)}" width="100%">${DEFS}${life}${heads}${parts.join('')}</svg>`
}

function flowLayoutFor(d: FlowDiagram) {
  const lr = layoutFlow(d)
  if (lr.width <= W * 1.15) return lr
  const tb = layoutFlow({ ...d, direction: 'TB' })
  return tb.width < lr.width ? tb : lr
}

export function flowSvg(d: FlowDiagram): string {
  const L = flowLayoutFor(d)
  const scale = Math.min(1, W / L.width)
  const font = Math.min(14, 11 / Math.max(scale, 0.7))
  const edges = L.edges
    .map((e) => {
      const pts = e.points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
      const mid = e.points[Math.floor(e.points.length / 2)] ?? { x: 0, y: 0 }
      const lab = e.label ? textLines(mid.x, mid.y - 14, wrapLabel(e.label, 18), { size: font }) : ''
      return `<polyline points="${pts}" fill="none" stroke="#222" stroke-width="1.4" marker-end="url(#ah)"/>${lab}`
    })
    .join('')
  const nodes = L.nodes
    .map((nd) => {
      const t = TONE[nd.tone] ?? (TONE.default as { fill: string; stroke: string })
      const lines = wrapLabel(nd.label, 21)
      return `<rect x="${nd.x.toFixed(1)}" y="${nd.y.toFixed(1)}" width="${nd.w}" height="${nd.h}" rx="8" fill="${t.fill}" stroke="${t.stroke}" stroke-width="1.4"/>` + textLines(nd.x + nd.w / 2, nd.y + nd.h / 2 - (lines.length * 13) / 2 + 1, lines, { size: font, lh: font + 2 })
    })
    .join('')
  const wpx = Math.round(L.width * scale)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L.width} ${L.height}" width="${wpx}">${DEFS}${edges}${nodes}</svg>`
}

export function diagramSvg(d: Diagram): string {
  return d.kind === 'sequence' ? sequenceSvg(d) : flowSvg(d)
}
