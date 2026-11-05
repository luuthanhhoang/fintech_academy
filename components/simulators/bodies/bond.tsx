'use client'

import { bondPrice, convexity, macaulayDuration, modifiedDuration, priceChangeEstimate, priceYieldCurve } from '@/lib/finance/bonds'
import { fmtNum, fmtPct } from '@/lib/util/format'
import { LineChartView } from '@/components/charts/line-chart'
import { Stat, StatGrid, Warning } from '../stat'
import type { SimBodyProps } from '../types'

export function BondSim({ values }: SimBodyProps) {
  const spec = { face: values.face ?? 100, couponRate: (values.couponPct ?? 0) / 100, years: Math.max(1, Math.round(values.years ?? 1)), freq: Math.max(1, Math.round(values.freq ?? 1)) }
  const y = (values.ytmPct ?? 0) / 100
  const price = bondPrice(spec, y)
  const est = priceChangeEstimate(spec, y, 0.01)
  const actual = bondPrice(spec, y + 0.01) / price - 1
  const lo = Math.max(-0.02, y - 0.06)
  const curve = priceYieldCurve(spec, lo, y + 0.06, 60)
  return (
    <div>
      {y < 0 && <Warning>Lợi suất âm: người mua trả giá cao hơn tổng dòng tiền sẽ nhận — chỉ xảy ra khi giữ tiền mặt còn tệ hơn.</Warning>}
      <StatGrid>
        <Stat label="Giá trái phiếu" value={fmtNum(price, 2)} hint={price > spec.face ? 'trên mệnh giá (premium)' : price < spec.face ? 'dưới mệnh giá (discount)' : 'bằng mệnh giá (par)'} />
        <Stat label="Macaulay duration" value={`${fmtNum(macaulayDuration(spec, y), 2)} năm`} />
        <Stat label="Modified duration" value={fmtNum(modifiedDuration(spec, y), 3)} />
        <Stat label="Convexity" value={fmtNum(convexity(spec, y), 2)} />
        <Stat label="Lợi suất +1 điểm %: ước lượng" value={fmtPct(est.withConvexity)} hint={`chỉ duration: ${fmtPct(est.duration)}`} />
        <Stat label="Lợi suất +1 điểm %: định giá lại" value={fmtPct(actual)} />
      </StatGrid>
      <LineChartView
        data={curve.map((c) => ({ ytm: c.ytm * 100, price: c.price }))}
        x="ytm"
        xLabel="Lợi suất đáo hạn (%)"
        yLabel="Giá"
        formatX={(v) => fmtNum(v, 1)}
        series={[{ key: 'price', label: 'Giá theo lợi suất', slot: 1 }]}
        refLines={[{ axis: 'x', value: y * 100, label: 'YTM hiện tại' }, { axis: 'y', value: spec.face, label: 'Mệnh giá' }]}
      />
    </div>
  )
}
