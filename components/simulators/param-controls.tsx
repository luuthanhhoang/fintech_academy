'use client'

import type { SimParam } from '@/lib/content/schema/simulator'
import type { Values } from './types'

/** Slider + number input pair for each declared parameter. */
export function ParamControls({ params, values, onChange }: { params: SimParam[]; values: Values; onChange: (key: string, value: number) => void }) {
  return (
    <div className="space-y-4">
      {params.map((p) => {
        const id = `param-${p.key}`
        const v = values[p.key] ?? p.default
        const clamp = (x: number) => Math.min(p.max, Math.max(p.min, x))
        return (
          <div key={p.key}>
            <label htmlFor={id} className="flex items-baseline justify-between gap-2 text-sm">
              <span>{p.label}</span>
              <span className="num text-xs text-ink-3">{p.unit}</span>
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input id={id} type="range" min={p.min} max={p.max} step={p.step} value={v} onChange={(e) => onChange(p.key, Number(e.target.value))} className="w-full accent-[var(--accent)]" />
              <input
                type="number"
                aria-label={`${p.label} (nhập số)`}
                min={p.min}
                max={p.max}
                step={p.step}
                value={v}
                onChange={(e) => e.target.value !== '' && Number.isFinite(Number(e.target.value)) && onChange(p.key, clamp(Number(e.target.value)))}
                className="num w-20 rounded border border-rule bg-paper px-1.5 py-0.5 text-right text-sm"
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
