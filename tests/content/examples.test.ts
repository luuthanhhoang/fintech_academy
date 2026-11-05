import { describe, expect, it } from 'vitest'
import { loadContent } from '@/lib/content/load'
import { bondPrice, modifiedDuration } from '@/lib/finance/bonds'
import { dcf } from '@/lib/finance/dcf'
import { realRateExact } from '@/lib/finance/inflation'
import { breakevens, strategyProfit } from '@/lib/finance/options'
import { minimumVariance, portfolioStats } from '@/lib/finance/portfolio'
import { effectiveAnnualRate, futureValue, npv } from '@/lib/finance/tvm'
import { withinTolerance } from '@/lib/quiz/grade'

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
}

describe('worked examples match lib/finance', () => {
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
