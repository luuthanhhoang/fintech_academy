import { describe, expect, it } from 'vitest'
import { loadContent } from '@/lib/content/load'
import { bondPrice, modifiedDuration } from '@/lib/finance/bonds'
import { dcf } from '@/lib/finance/dcf'
import { realRateExact } from '@/lib/finance/inflation'
import { breakevens, strategyProfit } from '@/lib/finance/options'
import { minimumVariance, portfolioStats } from '@/lib/finance/portfolio'
import { effectiveAnnualRate, futureValue, npv } from '@/lib/finance/tvm'
import { withinTolerance } from '@/lib/quiz/grade'
import { mmc } from '@/lib/systems/queueing'

const bundle = loadContent()
const examples = new Map(bundle.lessons.flatMap((l) => l.examples.map((e) => [e.id, e] as const)))
const call = (strike: number, position: 1 | -1, premium: number) => ({ kind: 'call' as const, position, strike, premium, qty: 1 })
const cov = [[0.04, 0.004], [0.004, 0.01]]
const w = minimumVariance(cov) as number[]
const d = dcf({ baseFcf: 100, growth: 0.05, years: 3, discount: 0.1, terminalGrowth: 0.02, netDebt: 0, shares: 1 })!

/** Expected value of each faded step, recomputed from the tested finance library (in step order). */
const EXPECTED: Record<string, number[]> = {
  'we-compound-monthly': [futureValue(100, 0.08, 3, 12), effectiveAnnualRate(0.08, 12) * 100],
  'we-npv-project': [500 / 1.21, npv(0.1, [-1000, 400, 500, 300])],
  'we-real-return': [realRateExact(0.07, 0.045) * 100, 50 * (1.07 / 1.045) ** 10],
  'we-ev-sharpe': [6, Math.sqrt(84)],
  'we-dcf-3y': [d.terminalValue, d.enterpriseValue],
  'we-bond-duration': [bondPrice({ face: 1000, couponRate: 0.06, years: 3, freq: 1 }, 0.08), modifiedDuration({ face: 1000, couponRate: 0.06, years: 3, freq: 1 }, 0.08)],
  'we-walk-the-book': [(200 * 10 + 200 * 10.1 + 100 * 10.2) / 500, 0.8],
  'we-bull-spread': [breakevens([call(100, 1, 6), call(110, -1, 2)], 50, 150)[0] as number, strategyProfit([call(100, 1, 6), call(110, -1, 2)], 107)],
  'we-min-variance': [w[0] as number, portfolioStats(w, [0.1, 0.05], cov).vol * 100],
  'we-mm1-latency': [mmc(80, 100).w * 1000, mmc(80, 100).l, mmc(95, 100).w * 1000],
  // Bank arithmetic: net interest income, NIM; duration gap D_A − (L/A)·D_L and ΔE ≈ −DGAP·A·Δy.
  'we-bank-nim': [900 * 0.07 - 850 * 0.04, ((900 * 0.07 - 850 * 0.04) / 900) * 100],
  'we-duration-gap': [6 - (1840 / 2000) * 0.8, -(6 - (1840 / 2000) * 0.8) * 2000 * 0.02],
  // Wallet reconciliation: ledger + unposted deposits, minus (bank − in-flight withdrawals).
  'we-wallet-recon': [980 + 12, 980 + 12 - (1000 - 30)],
  // Parametric VaR = z × σ × value; LCR = HQLA / (outflows − inflows).
  'we-param-var': [1.645 * 0.015 * 10000, 2.326 * 0.015 * 10000],
  'we-lcr': [1200 - 400, (900 / (1200 - 400)) * 100],
  // RWA = Σ exposure × weight (+ market/operational); CET1 ratio = CET1 / RWA.
  'we-cet1': [400 * 0.35 + 300 * 1, (60 / (400 * 0.35 + 300 * 1 + 100)) * 100],
  // Expected loss EL = PD × LGD × EAD per segment, then share of total exposure.
  'we-credit-el': [0.08 * 0.8 * 200, ((0.01 * 0.4 * 500 + 0.03 * 0.5 * 300 + 0.08 * 0.8 * 200) / 1000) * 100],
  // Allocation: floor each share, remainder to largest fractional part; total preserved.
  'we-allocate': [100000 - 3 * Math.floor(100000 / 3), 3 * Math.floor(100000 / 3) + (100000 - 3 * Math.floor(100000 / 3))],
  // Log returns add over time: Σ ln(P_t/P_t−1) = ln(P_T/P_0).
  'we-log-returns': [Math.log(1.1) + Math.log(0.9) + Math.log(1.1), (Math.exp(Math.log(1.1) + Math.log(0.9) + Math.log(1.1)) - 1) * 100],
  // Multiple testing: P(at least one false discovery) = 1 − 0.95^n.
  'we-multiple-tests': [(1 - 0.95 ** 20) * 100, (1 - 0.95 ** 100) * 100],
  // Single-factor model: β = Cov/Var, α = excess return − β × market excess return.
  'we-beta-alpha': [0.027 / 0.0225, (0.15 - (0.027 / 0.0225) * 0.12) * 100],
  // Confusion matrix on imbalanced data: accuracy, precision, recall.
  'we-fraud-pr': [((50000 - 400 - 20 + 80) / 50000) * 100, (80 / 400) * 100, (80 / 100) * 100],
  // Population stability index: Σ (actual − expected) × ln(actual / expected).
  'we-psi': [0.1 * Math.log(0.4 / 0.3), -0.1 * Math.log(0.2 / 0.3) + 0.1 * Math.log(0.4 / 0.3)],
  // Cache: DB load = rps × miss rate; mean latency = hit × cache + miss × db.
  'we-cache-load': [3000 * 0.02, 0.98 * 1 + 0.02 * 40],
  // Insurance: pure premium = frequency × severity; gross premium = pure / (1 − loadings).
  'we-insurance-premium': [0.08 * 1500000, (0.08 * 1500000) / 0.65],
  // Covered interest parity: F = S × (1 + i_quote·t) / (1 + i_base·t).
  'we-fx-forward': [(25000 * 1.06) / 1.04, (25000 * 1.03) / 1.02],
  // IFRS 9: 12-month ECL uses year-1 marginal PD; lifetime sums all years.
  'we-ecl-stages': [0.015 * 0.45 * 200, (0.015 + 0.025 + 0.035) * 0.45 * 200],
  // Custody reconciliation: obligations include in-flight withdrawals and pending deposits.
  'we-custody-recon': [5000 + 40 + 50, 4600 + 380 - (5000 + 40 + 50)],
}

describe('worked examples match the tested libraries', () => {
  it('covers every example in content', () => {
    expect([...examples.keys()].sort()).toEqual(Object.keys(EXPECTED).sort())
  })
  for (const [id, values] of Object.entries(EXPECTED)) {
    it(id, () => {
      const faded = examples.get(id)!.steps.filter((s) => s.faded)
      expect(faded).toHaveLength(values.length)
      faded.forEach((s, i) => expect(withinTolerance(values[i] as number, s.answer as number, s.tolerance!.kind, s.tolerance!.value)).toBe(true))
    })
  }
})
