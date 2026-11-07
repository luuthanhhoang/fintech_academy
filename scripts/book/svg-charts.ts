/** Minimal line / scatter / bar chart renderer (static SVG) for the printed simulator figures. */
import { esc } from './util'

const FONT = `font-family="'Times New Roman','Liberation Serif',serif"`
const W = 610
const H = 300
const M = { l: 62, r: 16, t: 16, b: 46 }

export interface Series {
  name: string
  points: { x: number; y: number }[]
  dash?: string
  color?: string
  /** 'line' (default) or 'dots'. */
  mode?: 'line' | 'dots'
}

export interface ChartSpec {
  xLabel: string
  yLabel: string
  series: Series[]
  xFmt?: (v: number) => string
  yFmt?: (v: number) => string
  yMin?: number
  hLines?: { y: number; label: string }[]
  /** Vertical marker lines. */
  vLines?: { x: number; label: string }[]
}

const COLORS = ['#1f3f6e', '#b5651d', '#2f7a46', '#7a2f6b']

function ticks(lo: number, hi: number, count = 5): number[] {
  const span = hi - lo || 1
  const raw = span / count
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag
  const out: number[] = []
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(Number(v.toPrecision(12)))
  return out
}

const defaultFmt = (v: number): string => (Math.abs(v) >= 1000 ? new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(v) : new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(v))

export function chartSvg(spec: ChartSpec): string {
  const all = spec.series.flatMap((s) => s.points)
  const xs = all.map((p) => p.x)
  const ys = all.map((p) => p.y).concat((spec.hLines ?? []).map((h) => h.y))
  const x0 = Math.min(...xs)
  const x1 = Math.max(...xs)
  const y0 = spec.yMin ?? Math.min(...ys)
  const y1 = Math.max(...ys)
  const pad = (y1 - y0) * 0.06 || 1
  const yLo = spec.yMin ?? y0 - pad
  const yHi = y1 + pad
  const px = (x: number) => M.l + ((x - x0) / (x1 - x0 || 1)) * (W - M.l - M.r)
  const py = (y: number) => H - M.b - ((y - yLo) / (yHi - yLo || 1)) * (H - M.t - M.b)
  const xf = spec.xFmt ?? defaultFmt
  const yf = spec.yFmt ?? defaultFmt
  const grid = ticks(yLo, yHi)
    .map((v) => `<line x1="${M.l}" x2="${W - M.r}" y1="${py(v).toFixed(1)}" y2="${py(v).toFixed(1)}" stroke="#ddd"/><text ${FONT} font-size="10" x="${M.l - 6}" y="${(py(v) + 3).toFixed(1)}" text-anchor="end" fill="#333">${esc(yf(v))}</text>`)
    .join('')
  const xt = ticks(x0, x1, 6)
    .map((v) => `<line x1="${px(v).toFixed(1)}" x2="${px(v).toFixed(1)}" y1="${H - M.b}" y2="${H - M.b + 4}" stroke="#333"/><text ${FONT} font-size="10" x="${px(v).toFixed(1)}" y="${H - M.b + 16}" text-anchor="middle" fill="#333">${esc(xf(v))}</text>`)
    .join('')
  const lines = spec.series
    .map((s, i) => {
      const c = s.color ?? COLORS[i % COLORS.length]
      if (s.mode === 'dots') return s.points.map((p) => `<circle cx="${px(p.x).toFixed(1)}" cy="${py(p.y).toFixed(1)}" r="1.7" fill="${c}" opacity="0.55"/>`).join('')
      const d = s.points.map((p, j) => `${j ? 'L' : 'M'}${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`).join(' ')
      return `<path d="${d}" fill="none" stroke="${c}" stroke-width="1.8"${s.dash ? ` stroke-dasharray="${s.dash}"` : ''}/>`
    })
    .join('')
  const hl = (spec.hLines ?? [])
    .map((h) => `<line x1="${M.l}" x2="${W - M.r}" y1="${py(h.y).toFixed(1)}" y2="${py(h.y).toFixed(1)}" stroke="#777" stroke-dasharray="4 3"/><text ${FONT} font-size="10" x="${W - M.r - 4}" y="${(py(h.y) - 4).toFixed(1)}" text-anchor="end" fill="#444">${esc(h.label)}</text>`)
    .join('')
  const vl = (spec.vLines ?? [])
    .map((v) => `<line x1="${px(v.x).toFixed(1)}" x2="${px(v.x).toFixed(1)}" y1="${M.t}" y2="${H - M.b}" stroke="#777" stroke-dasharray="4 3"/><text ${FONT} font-size="10" x="${(px(v.x) + 4).toFixed(1)}" y="${M.t + 10}" fill="#444">${esc(v.label)}</text>`)
    .join('')
  const legend = spec.series
    .map((s, i) => `<g transform="translate(${M.l + 8 + i * 170},${M.t + 8})"><line x1="0" x2="18" y1="0" y2="0" stroke="${s.color ?? COLORS[i % COLORS.length]}" stroke-width="2"${s.dash ? ` stroke-dasharray="${s.dash}"` : ''}/><text ${FONT} font-size="10.5" x="23" y="3.5" fill="#111">${esc(s.name)}</text></g>`)
    .join('')
  const axes = `<rect x="${M.l}" y="${M.t}" width="${W - M.l - M.r}" height="${H - M.t - M.b}" fill="none" stroke="#333"/>`
  const labels = `<text ${FONT} font-size="11" x="${(M.l + W - M.r) / 2}" y="${H - 8}" text-anchor="middle" fill="#111">${esc(spec.xLabel)}</text><text ${FONT} font-size="11" transform="translate(13,${(M.t + H - M.b) / 2}) rotate(-90)" text-anchor="middle" fill="#111">${esc(spec.yLabel)}</text>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%">${grid}${xt}${axes}${vl}${hl}${lines}${legend}${labels}</svg>`
}

/** Horizontal bars (e.g. order-book depth). */
export function depthSvg(bids: { price: number; qty: number }[], asks: { price: number; qty: number }[]): string {
  const levels = [...bids.slice().sort((a, b) => b.price - a.price), ...asks.slice().sort((a, b) => a.price - b.price)]
  const maxQ = Math.max(...levels.map((l) => l.qty))
  const rowH = 22
  const hgt = levels.length * rowH + 40
  const rows = levels
    .map((l, i) => {
      const bid = bids.includes(l)
      const w = (l.qty / maxQ) * 330
      const y = 28 + i * rowH
      return `<text ${FONT} font-size="11" x="92" y="${y + 13}" text-anchor="end" fill="#111">${l.price.toFixed(1)}</text><rect x="100" y="${y}" width="${w.toFixed(1)}" height="${rowH - 6}" fill="${bid ? '#9fc5a8' : '#e2a9a0'}" stroke="${bid ? '#2f7a46' : '#a8402f'}"/><text ${FONT} font-size="10.5" x="${(106 + w).toFixed(1)}" y="${y + 12}" fill="#111">${l.qty} cp · ${bid ? 'mua' : 'bán'}</text>`
    })
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${hgt}" width="100%"><text ${FONT} font-size="11" x="92" y="16" text-anchor="end" fill="#111">Giá</text><text ${FONT} font-size="11" x="100" y="16" fill="#111">Khối lượng đặt (cổ phiếu)</text>${rows}</svg>`
}
