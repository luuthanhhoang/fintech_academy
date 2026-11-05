'use client'

import { nominalVsReal, purchasingPower, realRateApprox, realRateExact } from '@/lib/finance/inflation'
import { fmtNum, fmtPct } from '@/lib/util/format'
import { LineChartView } from '@/components/charts/line-chart'
import { Stat, StatGrid, Warning } from '../stat'
import type { SimBodyProps } from '../types'

export function InflationSim({ values }: SimBodyProps) {
  const n = (values.nominalPct ?? 0) / 100
  const i = (values.inflationPct ?? 0) / 100
  const years = Math.round(values.years ?? 0)
  const amount = values.amount ?? 0
  const exact = realRateExact(n, i)
  const approx = realRateApprox(n, i)
  const series = nominalVsReal(amount, n, i, years)
  return (
    <div>
      {exact < 0 && <Warning>Lợi suất thực âm: số tiền danh nghĩa tăng nhưng sức mua giảm.</Warning>}
      {i <= -1 && <Warning>Lạm phát ≤ −100% không có nghĩa kinh tế (mức giá về 0).</Warning>}
      <StatGrid>
        <Stat label="Lợi suất thực (Fisher chính xác)" value={fmtPct(exact)} />
        <Stat label="Xấp xỉ r ≈ n − π" value={fmtPct(approx)} hint={`sai lệch ${fmtPct(approx - exact, 3)}`} />
        <Stat label={`Sức mua của ${fmtNum(amount, 0)} sau ${years} năm (không đầu tư)`} value={fmtNum(purchasingPower(amount, i, years), 0)} />
      </StatGrid>
      <LineChartView
        data={series.map((p) => ({ year: p.year, nominal: p.nominal, real: p.real }))}
        x="year"
        xLabel="Năm"
        yLabel="Giá trị"
        formatY={(v) => fmtNum(v, 0)}
        series={[
          { key: 'nominal', label: 'Danh nghĩa (nominal)', slot: 1 },
          { key: 'real', label: 'Thực (theo sức mua năm 0)', slot: 2 },
        ]}
      />
    </div>
  )
}
