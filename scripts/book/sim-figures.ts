/** Static figures for the 8 simulators, computed with the same pure lib/ functions the interactive versions use. */
import { bondPrice, type BondSpec } from '../../lib/finance/bonds'
import { dcf, sensitivity } from '../../lib/finance/dcf'
import { nominalVsReal } from '../../lib/finance/inflation'
import { payoffCurve, type Leg } from '../../lib/finance/options'
import { analyticFrontier, annualize, randomPortfolios, upperEnvelope } from '../../lib/finance/portfolio'
import { growthSeries } from '../../lib/finance/tvm'
import { syntheticBook } from '../../lib/finance/synthetic-book'
import { utilisationCurve } from '../../lib/systems/queueing'
import type { Simulator } from '../../lib/content/schema/simulator'
import { chartSvg, depthSvg } from './svg-charts'
import { fmtNum } from './util'

export interface SimFigure {
  caption: string
  svg: string
}

type Params = Record<string, number>

const pct = (v: number): string => `${fmtNum(Math.round(v * 10) / 10)}%`

function bond(p: Params): SimFigure[] {
  const spec: BondSpec = { face: p.face!, couponRate: p.couponPct! / 100, years: p.years!, freq: p.freq! }
  const pts = Array.from({ length: 41 }, (_, i) => {
    const y = 0.01 + (0.13 * i) / 40
    return { x: y * 100, y: bondPrice(spec, y) }
  })
  return [{
    caption: `Giá trái phiếu theo lợi suất đáo hạn (mệnh giá ${fmtNum(p.face!)}, coupon ${p.couponPct}%/năm, ${p.years} năm, ${p.freq} kỳ/năm). Đường cong lồi: lợi suất tăng thì giá giảm, nhưng giảm chậm dần.`,
    svg: chartSvg({ xLabel: 'Lợi suất đáo hạn (%/năm)', yLabel: 'Giá trái phiếu', series: [{ name: 'Giá lý thuyết', points: pts }], hLines: [{ y: p.face!, label: 'Mệnh giá' }], vLines: [{ x: p.couponPct!, label: 'YTM = coupon' }], xFmt: (v) => `${v}%` }),
  }]
}

function tvm(p: Params): SimFigure[] {
  const years = p.years!
  const rate = p.ratePct! / 100
  const g = growthSeries(p.principal!, rate, years, p.compoundsPerYear!, p.contribution!)
  const simple = Array.from({ length: years + 1 }, (_, t) => ({ x: t, y: p.principal! * (1 + rate * t) }))
  return [{
    caption: `Lãi kép so với lãi đơn: ${fmtNum(p.principal!)} đơn vị tiền, ${p.ratePct}%/năm, ghép lãi ${p.compoundsPerYear} lần/năm trong ${years} năm.`,
    svg: chartSvg({ xLabel: 'Số năm', yLabel: 'Giá trị tài khoản', series: [{ name: 'Lãi kép', points: g.map((q) => ({ x: q.year, y: q.balance })) }, { name: 'Lãi đơn', points: simple, dash: '5 4' }], yMin: 0 }),
  }]
}

function inflation(p: Params): SimFigure[] {
  const s = nominalVsReal(p.amount!, p.nominalPct! / 100, p.inflationPct! / 100, p.years!)
  return [{
    caption: `Giá trị danh nghĩa và giá trị thực (theo sức mua hôm nay): lãi suất danh nghĩa ${p.nominalPct}%/năm, lạm phát ${p.inflationPct}%/năm.`,
    svg: chartSvg({ xLabel: 'Số năm', yLabel: 'Giá trị', series: [{ name: 'Danh nghĩa', points: s.map((q) => ({ x: q.year, y: q.nominal })) }, { name: 'Thực (đã trừ lạm phát)', points: s.map((q) => ({ x: q.year, y: q.real })), dash: '5 4' }], yMin: 0 }),
  }]
}

function legsFor(sim: Simulator, id: string, p: Params): Leg[] {
  type RawLeg = { kind: string; position: number; strike: string; premium: string | null }
  const strategies = (sim.config.strategies ?? []) as { id: string; legs: RawLeg[] }[]
  const st = strategies.find((s) => s.id === id)
  if (!st) return []
  return st.legs.map((l) => ({ kind: l.kind as Leg['kind'], position: l.position as 1 | -1, strike: p[l.strike] ?? 0, premium: l.premium ? (p[l.premium] ?? 0) : 0, qty: p.qty! }))
}

function options(sim: Simulator, p: Params): SimFigure[] {
  const chosen = [['long-call', 'Mua call'], ['bull-call-spread', 'Bull call spread'], ['straddle', 'Straddle']] as const
  return chosen.map(([id, name]) => {
    const legs = legsFor(sim, id, p)
    const curve = payoffCurve(legs, p.strike1! * 0.7, p.strike2! * 1.3, 120)
    return {
      caption: `Lãi/lỗ tại thời điểm đáo hạn — ${name} (K1 = ${p.strike1}, K2 = ${p.strike2}, phí ${p.premium1} và ${p.premium2}).`,
      svg: chartSvg({ xLabel: 'Giá tài sản cơ sở khi đáo hạn', yLabel: 'Lãi/lỗ', series: [{ name, points: curve.map((c) => ({ x: c.spot, y: c.profit })) }], hLines: [{ y: 0, label: 'Hoà vốn' }] }),
    }
  })
}

function dcfFig(p: Params): SimFigure[] {
  const input = { baseFcf: p.baseFcf!, growth: p.growthPct! / 100, years: p.years!, discount: p.discountPct! / 100, terminalGrowth: p.terminalGrowthPct! / 100, netDebt: p.netDebt!, shares: p.shares! }
  const r = dcf(input)
  if (!r) return []
  const discounts = [0.08, 0.09, 0.1, 0.11, 0.12]
  const growths = [0.01, 0.02, 0.03, 0.04]
  const grid = sensitivity(input, discounts, growths)
  const head = `<tr><th>Tỉ lệ chiết khấu \\ Tăng trưởng dài hạn</th>${growths.map((g) => `<th>${pct(g * 100)}</th>`).join('')}</tr>`
  const rows = grid.map((row, i) => `<tr><th>${pct((discounts[i] as number) * 100)}</th>${row.map((v) => `<td>${v === null ? '—' : fmtNum(Math.round(v))}</td>`).join('')}</tr>`).join('')
  const table = `<table class="data"><thead>${head}</thead><tbody>${rows}</tbody></table>`
  const kpi = `<p class="fig-note">Với tham số mặc định: giá trị doanh nghiệp ≈ ${fmtNum(Math.round(r.enterpriseValue))}, trong đó giá trị cuối kỳ chiếm ${pct(r.terminalShare * 100)}; giá trị vốn chủ ≈ ${fmtNum(Math.round(r.equityValue))}.</p>`
  return [{ caption: 'Độ nhạy của giá trị doanh nghiệp (đơn vị tiền) theo tỉ lệ chiết khấu và tăng trưởng dài hạn.', svg: kpi + table }]
}

function queueing(p: Params): SimFigure[] {
  const mu = 1000 / p.serviceMs!
  const curve = utilisationCurve(mu, p.servers!, 0.05, 0.97, 60)
  return [{
    caption: `Thời gian phản hồi theo mức sử dụng (thời gian phục vụ ${p.serviceMs} ms, ${p.servers} worker). Đường cong dựng đứng khi mức sử dụng tiến gần 100% — vì thế hệ thống nên chạy dưới ngưỡng này.`,
    svg: chartSvg({ xLabel: 'Mức sử dụng ρ (%)', yLabel: 'Thời gian (ms)', series: [{ name: 'Trung bình trong hệ thống', points: curve.map((c) => ({ x: c.rho * 100, y: c.w * 1000 })) }, { name: 'p99 thời gian chờ', points: curve.map((c) => ({ x: c.rho * 100, y: c.p99Wait * 1000 })), dash: '5 4' }], yMin: 0 }),
  }]
}

function orderbook(p: Params): SimFigure[] {
  const book = syntheticBook({ mid: p.mid!, spreadTicks: p.spreadTicks!, tick: p.tick!, levels: p.levels!, baseQty: p.baseQty!, seed: p.seed! })
  return [{ caption: `Sổ lệnh tổng hợp (mô phỏng) quanh giá giữa ${p.mid}, ${p.levels} mức mỗi phía. Lệnh thị trường lớn sẽ ăn dần các mức giá — đó là trượt giá.`, svg: depthSvg(book.depth('buy'), book.depth('sell')) }]
}

function portfolio(sim: Simulator, p: Params): SimFigure[] {
  const assets = (sim.config.assets ?? []) as { muPct: number; sigmaPct: number }[]
  const mu = assets.map((a) => a.muPct / 100)
  const rho = p.rho!
  const cov = assets.map((a, i) => assets.map((b, j) => (i === j ? (a.sigmaPct / 100) ** 2 : rho * (a.sigmaPct / 100) * (b.sigmaPct / 100))))
  const ann = annualize(mu, cov, 12)
  const cloud = randomPortfolios(ann.mu, ann.cov, 600, p.seed!)
  const env = upperEnvelope(cloud)
  const frontier = analyticFrontier(ann.mu, ann.cov, 60) ?? []
  const toPt = (q: { vol: number; ret: number }) => ({ x: q.vol * 100, y: q.ret * 100 })
  return [{
    caption: `Danh mục ngẫu nhiên chỉ mua (chấm), đường biên hiệu quả chỉ mua và đường biên Markowitz cho phép bán khống, với ba tài sản giả định, tương quan ρ = ${rho}.`,
    svg: chartSvg({ xLabel: 'Độ biến động (%/năm)', yLabel: 'Lợi suất kỳ vọng (%/năm)', series: [{ name: 'Danh mục ngẫu nhiên', points: cloud.map(toPt), mode: 'dots', color: '#777' }, { name: 'Biên hiệu quả (chỉ mua)', points: env.map(toPt) }, { name: 'Biên Markowitz (bán khống)', points: frontier.map(toPt), dash: '5 4' }], xFmt: (v) => `${fmtNum(Math.round(v))}%`, yFmt: (v) => `${fmtNum(Math.round(v * 10) / 10)}%` }),
  }]
}

/** Figures for a simulator at its default parameters; unknown keys yield none. */
export function simulatorFigures(sim: Simulator): SimFigure[] {
  const p: Params = Object.fromEntries(sim.params.map((x) => [x.key, x.default]))
  switch (sim.componentKey) {
    case 'bond': return bond(p)
    case 'tvm': return tvm(p)
    case 'inflation': return inflation(p)
    case 'options': return options(sim, p)
    case 'dcf': return dcfFig(p)
    case 'queueing': return queueing(p)
    case 'orderbook': return orderbook(p)
    case 'portfolio': return portfolio(sim, p)
    default: return []
  }
}
