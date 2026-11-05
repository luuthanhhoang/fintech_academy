'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { Simulator } from '@/lib/content/schema/simulator'
import type { SimulatorKey } from '@/lib/registry/keys'
import { SyntheticBadge } from '@/components/ui/badges'
import { ErrorState } from '@/components/ui/states'
import { ParamControls } from './param-controls'
import { SIMULATOR_REGISTRY } from './registry'
import type { Values } from './types'

function defaults(meta: Simulator, initial?: Values): Values {
  return Object.fromEntries(meta.params.map((p) => [p.key, initial?.[p.key] ?? p.default]))
}

/** Shared chrome for every simulator: parameters, "try to break it" presets, reading guide, data label. */
export function SimulatorFrame({ meta, syntheticLabel, initial, embedded = false }: { meta: Simulator; syntheticLabel: string; initial?: Values; embedded?: boolean }) {
  const [values, setValues] = useState<Values>(() => defaults(meta, initial))
  const [broken, setBroken] = useState<string | null>(null)
  const Body = SIMULATOR_REGISTRY[meta.componentKey as SimulatorKey]
  const active = meta.breakIt.find((b) => b.id === broken)

  return (
    <figure className="my-8 rounded-xl border border-rule bg-paper font-sans">
      <figcaption className="flex flex-wrap items-center gap-2 border-b border-rule px-4 py-3">
        <span className="text-xs uppercase tracking-wider text-ink-3">Mô phỏng</span>
        <span className="font-medium">{meta.title.vi}</span>
        <span className="text-sm text-ink-3">({meta.title.en})</span>
        {meta.dataKind === 'synthetic' && <SyntheticBadge label={syntheticLabel} note={meta.syntheticNote} />}
        {embedded && (
          <Link href={`/simulators/${meta.id}/`} className="ml-auto text-xs text-accent underline">
            Mở toàn màn hình
          </Link>
        )}
      </figcaption>
      <div className="grid gap-6 p-4 md:grid-cols-[240px_1fr]">
        <div>
          <ParamControls params={meta.params} values={values} onChange={(k, v) => (setValues((s) => ({ ...s, [k]: v })), setBroken(null))} />
          <button type="button" onClick={() => (setValues(defaults(meta)), setBroken(null))} className="mt-3 text-xs text-ink-3 underline">
            Đặt lại mặc định
          </button>
        </div>
        <div className="min-w-0">{Body ? <Body meta={meta} values={values} syntheticLabel={syntheticLabel} /> : <ErrorState error={`Chưa có component "${meta.componentKey}"`} />}</div>
      </div>
      <div className="border-t border-rule px-4 py-3">
        <p className="text-sm font-medium">Thử phá nó (break it)</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {meta.breakIt.map((b) => (
            <button
              key={b.id}
              type="button"
              aria-pressed={broken === b.id}
              onClick={() => (setValues({ ...defaults(meta), ...b.params }), setBroken(b.id))}
              className="rounded-full border border-warn px-3 py-1 text-xs text-warn aria-pressed:bg-warn-soft"
            >
              {b.label}
            </button>
          ))}
        </div>
        {active && <p role="status" className="mt-3 rounded-md bg-warn-soft p-3 text-sm text-ink">{active.explanation}</p>}
        <details className="mt-3 text-sm text-ink-2">
          <summary className="cursor-pointer">Cách đọc kết quả</summary>
          <p className="mt-2 whitespace-pre-line">{meta.howToRead}</p>
        </details>
      </div>
    </figure>
  )
}
