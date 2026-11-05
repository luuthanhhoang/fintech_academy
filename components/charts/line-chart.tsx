'use client'

import { useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { fmtNum } from '@/lib/util/format'

export interface Series {
  key: string
  label: string
  slot: 1 | 2 | 3 | 4
  dashed?: boolean
}

export interface RefLine {
  axis: 'x' | 'y'
  value: number
  label: string
}

export interface LineChartProps {
  data: Record<string, number | null>[]
  x: string
  xLabel: string
  yLabel: string
  series: Series[]
  refLines?: RefLine[]
  formatX?: (v: number) => string
  formatY?: (v: number) => string
  height?: number
}

const AXIS = { stroke: 'var(--ink-3)', fontSize: 12, tickLine: false } as const

/** Recharts line chart on design tokens, with crosshair tooltip and a table view for accessibility. */
export function LineChartView({ data, x, xLabel, yLabel, series, refLines = [], formatX = (v) => fmtNum(v), formatY = (v) => fmtNum(v), height = 280 }: LineChartProps) {
  const [table, setTable] = useState(false)
  return (
    <div className="font-sans">
      <div className="mb-1 flex justify-end">
        <button type="button" onClick={() => setTable((t) => !t)} className="text-xs text-ink-3 underline">
          {table ? 'Xem biểu đồ' : 'Xem dạng bảng'}
        </button>
      </div>
      {table ? (
        <div className="max-h-72 overflow-auto rounded border border-rule">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-paper-2">
              <tr>
                <th className="px-2 py-1 text-left">{xLabel}</th>
                {series.map((s) => (
                  <th key={s.key} className="px-2 py-1 text-right">{s.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className="border-t border-rule">
                  <td className="num px-2 py-1">{formatX(row[x] as number)}</td>
                  {series.map((s) => (
                    <td key={s.key} className="num px-2 py-1 text-right">{row[s.key] === null ? '—' : formatY(row[s.key] as number)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ height }} role="img" aria-label={`Biểu đồ ${series.map((s) => s.label).join(', ')} theo ${xLabel}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 16, bottom: 20, left: 8 }}>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey={x} type="number" domain={['dataMin', 'dataMax']} tickFormatter={formatX} {...AXIS} label={{ value: xLabel, position: 'insideBottom', offset: -12, fill: 'var(--ink-3)', fontSize: 12 }} />
              <YAxis tickFormatter={formatY} width={72} {...AXIS} label={{ value: yLabel, angle: -90, position: 'insideLeft', fill: 'var(--ink-3)', fontSize: 12, dy: 40 }} />
              <Tooltip
                formatter={(v, name) => [formatY(Number(v)), name]}
                labelFormatter={(v) => `${xLabel}: ${formatX(Number(v))}`}
                contentStyle={{ background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 6, color: 'var(--ink)', fontSize: 12 }}
                cursor={{ stroke: 'var(--ink-3)', strokeDasharray: '3 3' }}
              />
              {series.length >= 2 && <Legend verticalAlign="top" height={28} iconType="plainline" wrapperStyle={{ fontSize: 12, color: 'var(--ink-2)' }} />}
              {refLines.map((r) =>
                r.axis === 'x' ? (
                  <ReferenceLine key={r.label} x={r.value} stroke="var(--ink-3)" strokeDasharray="4 4" label={{ value: r.label, fill: 'var(--ink-2)', fontSize: 11, position: 'insideTopRight' }} />
                ) : (
                  <ReferenceLine key={r.label} y={r.value} stroke="var(--ink-3)" strokeDasharray="4 4" label={{ value: r.label, fill: 'var(--ink-2)', fontSize: 11, position: 'insideTopRight' }} />
                ),
              )}
              {series.map((s) => (
                <Line key={s.key} dataKey={s.key} name={s.label} type="monotone" stroke={`var(--chart-${s.slot})`} strokeWidth={2} strokeDasharray={s.dashed ? '6 4' : undefined} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} connectNulls={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
