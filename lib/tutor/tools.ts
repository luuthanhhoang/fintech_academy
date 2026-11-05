/**
 * Calculator tools exposed to the tutor. Every number the tutor states must come from here (lib/finance),
 * never from the model's own arithmetic.
 */
import { z } from 'zod'
import { bondPrice, macaulayDuration, modifiedDuration, yieldToMaturity } from '../finance/bonds'
import { dcf, wacc } from '../finance/dcf'
import { realRateExact } from '../finance/inflation'
import { strategyProfit } from '../finance/options'
import { portfolioStats } from '../finance/portfolio'
import { annuityPresentValue, effectiveAnnualRate, futureValue, irr, npv, presentValue } from '../finance/tvm'
import type { ToolSpec } from './provider'

const rate = z.number().describe('Lãi suất dạng thập phân, ví dụ 0.05 = 5%')

interface ToolDef<S extends z.ZodType> {
  description: string
  schema: S
  run: (input: z.infer<S>) => unknown
}

const def = <S extends z.ZodType>(d: ToolDef<S>) => d

export const TOOLS = {
  arithmetic: def({
    description: 'Phép tính số học cơ bản a (op) b. Dùng cho mọi phép cộng/trừ/nhân/chia/luỹ thừa.',
    schema: z.object({ a: z.number(), b: z.number(), op: z.enum(['add', 'sub', 'mul', 'div', 'pow']) }),
    run: ({ a, b, op }) => {
      const ops = { add: a + b, sub: a - b, mul: a * b, div: b === 0 ? null : a / b, pow: Math.pow(a, b) }
      return { result: ops[op] }
    },
  }),
  future_value: def({
    description: 'Giá trị tương lai của khoản tiền PV với lãi suất danh nghĩa năm, số năm, số lần ghép lãi mỗi năm (0 = ghép liên tục).',
    schema: z.object({ pv: z.number(), rate, years: z.number(), compoundsPerYear: z.number().nonnegative() }),
    run: ({ pv, rate: r, years, compoundsPerYear: m }) => ({ fv: futureValue(pv, r, years, m === 0 ? Infinity : m), ear: effectiveAnnualRate(r, m === 0 ? Infinity : m) }),
  }),
  present_value: def({
    description: 'Giá trị hiện tại của khoản tiền FV nhận sau `years` năm.',
    schema: z.object({ fv: z.number(), rate, years: z.number(), compoundsPerYear: z.number().positive().default(1) }),
    run: ({ fv, rate: r, years, compoundsPerYear }) => ({ pv: presentValue(fv, r, years, compoundsPerYear) }),
  }),
  annuity_pv: def({
    description: 'Giá trị hiện tại của chuỗi tiền đều cuối kỳ.',
    schema: z.object({ payment: z.number(), ratePerPeriod: rate, periods: z.number().int().positive() }),
    run: ({ payment, ratePerPeriod, periods }) => ({ pv: annuityPresentValue(payment, ratePerPeriod, periods) }),
  }),
  npv_irr: def({
    description: 'NPV tại lãi suất chiết khấu và IRR của chuỗi dòng tiền (phần tử đầu tại t=0).',
    schema: z.object({ rate, cashflows: z.array(z.number()).min(2) }),
    run: ({ rate: r, cashflows }) => ({ npv: npv(r, cashflows), irr: irr(cashflows) }),
  }),
  real_rate: def({
    description: 'Lợi suất thực theo phương trình Fisher chính xác.',
    schema: z.object({ nominal: rate, inflation: rate }),
    run: ({ nominal, inflation }) => ({ real: realRateExact(nominal, inflation) }),
  }),
  bond: def({
    description: 'Giá, Macaulay/modified duration của trái phiếu coupon cố định; hoặc YTM nếu cho giá.',
    schema: z.object({ face: z.number().positive(), couponRate: rate, years: z.number().positive(), freq: z.number().int().positive(), ytm: rate.optional(), price: z.number().positive().optional() }),
    run: ({ face, couponRate, years, freq, ytm, price }) => {
      const spec = { face, couponRate, years, freq }
      const y = ytm ?? (price !== undefined ? yieldToMaturity(spec, price) : null)
      if (y === null || y === undefined) return { error: 'Cần ytm hoặc price' }
      return { ytm: y, price: bondPrice(spec, y), macaulayDuration: macaulayDuration(spec, y), modifiedDuration: modifiedDuration(spec, y) }
    },
  }),
  option_profit: def({
    description: 'Lãi/lỗ tại đáo hạn của chiến lược quyền chọn nhiều chân ở giá cơ sở `spot`.',
    schema: z.object({
      spot: z.number().nonnegative(),
      legs: z.array(z.object({ kind: z.enum(['call', 'put', 'stock']), position: z.union([z.literal(1), z.literal(-1)]), strike: z.number(), premium: z.number(), qty: z.number().positive() })).min(1),
    }),
    run: ({ spot, legs }) => ({ profit: strategyProfit(legs, spot) }),
  }),
  dcf: def({
    description: 'Định giá DCF: FCF năm gốc tăng trưởng đều, giá trị cuối kỳ Gordon, trừ nợ ròng.',
    schema: z.object({ baseFcf: z.number(), growth: rate, years: z.number().int().positive(), discount: rate, terminalGrowth: rate, netDebt: z.number(), shares: z.number().nonnegative() }),
    run: (i) => dcf(i) ?? { error: 'Không xác định: discount phải lớn hơn terminalGrowth' },
  }),
  wacc: def({
    description: 'Chi phí vốn bình quân gia quyền (WACC).',
    schema: z.object({ equity: z.number().positive(), debt: z.number().nonnegative(), costEquity: rate, costDebt: rate, taxRate: rate }),
    run: ({ equity, debt, costEquity, costDebt, taxRate }) => ({ wacc: wacc(equity, debt, costEquity, costDebt, taxRate) }),
  }),
  portfolio_stats: def({
    description: 'Lợi suất kỳ vọng và độ lệch chuẩn của danh mục từ trọng số, lợi suất kỳ vọng và ma trận hiệp phương sai.',
    schema: z.object({ weights: z.array(z.number()).min(1), expectedReturns: z.array(z.number()).min(1), covariance: z.array(z.array(z.number())).min(1) }),
    run: ({ weights, expectedReturns, covariance }) => portfolioStats(weights, expectedReturns, covariance),
  }),
} as const

export type ToolName = keyof typeof TOOLS

export function toolSpecs(): ToolSpec[] {
  return Object.entries(TOOLS).map(([name, t]) => ({ name, description: t.description, inputSchema: z.toJSONSchema(t.schema) as Record<string, unknown> }))
}

export function executeTool(name: string, input: unknown): { ok: boolean; output: unknown } {
  const tool = (TOOLS as Record<string, ToolDef<z.ZodType>>)[name]
  if (!tool) return { ok: false, output: { error: `Không có công cụ ${name}` } }
  const parsed = tool.schema.safeParse(input)
  if (!parsed.success) return { ok: false, output: { error: 'Tham số không hợp lệ', issues: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) } }
  try {
    return { ok: true, output: tool.run(parsed.data) }
  } catch (e) {
    return { ok: false, output: { error: e instanceof Error ? e.message : String(e) } }
  }
}
