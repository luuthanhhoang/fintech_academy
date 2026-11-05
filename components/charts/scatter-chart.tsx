'use client'

import { CartesianGrid, Legend, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts'
import { fmtPct } from '@/lib/util/format'

export interface ScatterSeries {
  key: string
  label: string
  slot: 1 | 2 | 3 | 4
  points: { x: number; y: number; name?: string }[]
  line?: boolean
  size?: number
}

/** Risk–return scatter: x = volatility, y = expected return (both decimals, shown as %). */
export function RiskReturnChart({ series, height = 320 }: { series: ScatterSeries[]; height?: number }) {
  return (
    <div style={{ height }} className="font-sans" role="img" aria-label="Biểu đồ rủi ro – lợi suất">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
          <CartesianGrid stroke="var(--chart-grid)" />
          <XAxis type="number" dataKey="x" name="Độ lệch chuẩn" tickFormatter={(v) => fmtPct(v, 0)} stroke="var(--ink-3)" fontSize={12} label={{ value: 'Rủi ro σ (năm)', position: 'insideBottom', offset: -14, fill: 'var(--ink-3)', fontSize: 12 }} />
          <YAxis type="number" dataKey="y" name="Lợi suất kỳ vọng" tickFormatter={(v) => fmtPct(v, 0)} stroke="var(--ink-3)" fontSize={12} width={56} />
          <ZAxis range={[24, 24]} />
          <Tooltip
            formatter={(v, n) => [fmtPct(Number(v), 2), n]}
            contentStyle={{ background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 6, color: 'var(--ink)', fontSize: 12 }}
          />
          <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: 12, color: 'var(--ink-2)' }} />
          {series.map((s) => (
            <Scatter key={s.key} name={s.label} data={s.points} fill={`var(--chart-${s.slot})`} line={s.line ? { stroke: `var(--chart-${s.slot})`, strokeWidth: 2 } : false} shape={s.line ? () => <g /> : 'circle'} isAnimationActive={false} fillOpacity={s.line ? 1 : 0.55} />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
