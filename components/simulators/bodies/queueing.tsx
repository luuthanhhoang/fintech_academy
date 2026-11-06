'use client'

import { mmc, utilisationCurve } from '@/lib/systems/queueing'
import { fmtNum, fmtPct } from '@/lib/util/format'
import { LineChartView } from '@/components/charts/line-chart'
import { Stat, StatGrid, Warning } from '../stat'
import type { SimBodyProps } from '../types'

const ms = (s: number) => (Number.isFinite(s) ? `${fmtNum(s * 1000, 1)} ms` : '∞')

/** Latency vs load for an M/M/c queue: the curve bends sharply as utilisation approaches 100%. */
export function QueueingSim({ values }: SimBodyProps) {
  const lambda = values.arrivalRate ?? 0
  const serviceMs = Math.max(0.1, values.serviceMs ?? 10)
  const c = Math.max(1, Math.round(values.servers ?? 1))
  const mu = 1000 / serviceMs
  const s = mmc(lambda, mu, c)
  const curve = utilisationCurve(mu, c).map((p) => ({ util: p.rho * 100, w: p.w * 1000, p99: p.p99Wait * 1000 }))
  return (
    <div>
      {!s.stable && <Warning>Tải vượt công suất (ρ ≥ 100%): hàng đợi dài vô hạn — request sẽ timeout hoặc phải bị từ chối/giảm tải.</Warning>}
      {s.stable && s.rho > 0.8 && <Warning>Trên ~80% công suất, chỉ một chút tăng tải làm độ trễ tăng mạnh (xem đường cong).</Warning>}
      <StatGrid>
        <Stat label="Mức sử dụng mỗi server ρ" value={fmtPct(s.rho, 0)} hint={`công suất tối đa ${fmtNum(c * mu, 0)} req/s`} />
        <Stat label="Thời gian phản hồi trung bình W" value={ms(s.w)} hint={`trong đó chờ ${ms(s.wq)}`} />
        <Stat label="Xác suất phải xếp hàng" value={fmtPct(s.pWait, 0)} />
        <Stat label="p99 thời gian chờ trong hàng" value={ms(s.p99Wait)} />
        <Stat label="Số request trong hệ (Little: L = λW)" value={Number.isFinite(s.l) ? fmtNum(s.l, 2) : '∞'} />
      </StatGrid>
      <LineChartView
        data={curve}
        x="util"
        xLabel="Mức sử dụng (%)"
        yLabel="Thời gian (ms)"
        formatX={(v) => `${fmtNum(v, 0)}%`}
        formatY={(v) => fmtNum(v, 0)}
        refLines={s.stable ? [{ axis: 'x', value: s.rho * 100, label: 'Hiện tại' }] : []}
        series={[
          { key: 'w', label: 'Thời gian phản hồi trung bình', slot: 1 },
          { key: 'p99', label: 'p99 thời gian chờ', slot: 2, dashed: true },
        ]}
      />
    </div>
  )
}
