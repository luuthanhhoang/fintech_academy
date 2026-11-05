'use client'

import { dcf, sensitivity } from '@/lib/finance/dcf'
import { fmtNum, fmtPct } from '@/lib/util/format'
import { Stat, StatGrid, Warning } from '../stat'
import type { SimBodyProps } from '../types'

const DELTAS = [-0.02, -0.01, 0, 0.01, 0.02]

export function DcfSim({ values }: SimBodyProps) {
  const input = {
    baseFcf: values.baseFcf ?? 0,
    growth: (values.growthPct ?? 0) / 100,
    years: Math.max(1, Math.round(values.years ?? 1)),
    discount: (values.discountPct ?? 0) / 100,
    terminalGrowth: (values.terminalGrowthPct ?? 0) / 100,
    netDebt: values.netDebt ?? 0,
    shares: values.shares ?? 0,
  }
  const r = dcf(input)
  const discounts = DELTAS.map((d) => input.discount + d)
  const growths = DELTAS.map((d) => input.terminalGrowth + d)
  const grid = sensitivity(input, discounts, growths)
  if (!r) return <Warning>Không xác định: tỷ lệ chiết khấu phải lớn hơn tăng trưởng dài hạn (r &gt; g), nếu không công thức Gordon chia cho số ≤ 0.</Warning>
  return (
    <div>
      {r.terminalShare > 0.75 && <Warning>Hơn 75% giá trị đến từ giá trị cuối kỳ (terminal value) — kết quả cực kỳ nhạy với giả định dài hạn.</Warning>}
      {r.equityValue < 0 && <Warning>Giá trị vốn chủ âm: nợ ròng lớn hơn giá trị doanh nghiệp.</Warning>}
      <StatGrid>
        <Stat label="PV dòng tiền giai đoạn dự phóng" value={fmtNum(r.pvExplicit, 0)} />
        <Stat label="PV giá trị cuối kỳ" value={fmtNum(r.pvTerminal, 0)} hint={`${fmtPct(r.terminalShare, 0)} tổng giá trị`} />
        <Stat label="Giá trị doanh nghiệp (EV)" value={fmtNum(r.enterpriseValue, 0)} />
        <Stat label="Giá trị vốn chủ" value={fmtNum(r.equityValue, 0)} />
        <Stat label="Giá trị / cổ phần" value={fmtNum(r.perShare, 2)} />
      </StatGrid>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="mb-1 text-left text-xs text-ink-3">Độ nhạy EV: hàng = tỷ lệ chiết khấu, cột = tăng trưởng dài hạn</caption>
          <thead>
            <tr>
              <th className="px-2 py-1 text-left">r \ g</th>
              {growths.map((g) => (
                <th key={g} className="num px-2 py-1 text-right">{fmtPct(g, 1)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, i) => (
              <tr key={i} className="border-t border-rule">
                <th className="num px-2 py-1 text-left font-normal">{fmtPct(discounts[i], 1)}</th>
                {row.map((cell, j) => (
                  <td key={j} className={`num px-2 py-1 text-right ${i === 2 && j === 2 ? 'bg-accent-soft font-semibold' : ''}`}>{cell === null ? 'không xác định' : fmtNum(cell, 0)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
