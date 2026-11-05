'use client'

import { useMemo, type ReactNode } from 'react'
import type { QuizItem } from '@/lib/content/schema/quiz'
import type { QuizAnswer } from '@/lib/quiz/grade'
import { seededShuffle } from '@/lib/quiz/grade'

export interface ViewProps<T extends QuizItem['type']> {
  item: Extract<QuizItem, { type: T }>
  value: Extract<QuizAnswer, { type: T }>
  onChange: (v: Extract<QuizAnswer, { type: T }>) => void
  locked: boolean
  explainExtra?: ReactNode
}

export function McqView({ item, value, onChange, locked }: ViewProps<'mcq'>) {
  const multi = item.correct.length > 1
  const toggle = (id: string) => {
    const selected = multi ? (value.selected.includes(id) ? value.selected.filter((x) => x !== id) : [...value.selected, id]) : [id]
    onChange({ type: 'mcq', selected })
  }
  return (
    <fieldset disabled={locked} className="space-y-2">
      <legend className="sr-only">{multi ? 'Chọn tất cả đáp án đúng' : 'Chọn một đáp án'}</legend>
      {multi && <p className="text-xs text-ink-3">Chọn tất cả đáp án đúng.</p>}
      {item.options.map((o) => {
        const chosen = value.selected.includes(o.id)
        const right = locked && item.correct.includes(o.id)
        return (
          <label key={o.id} className={`flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 text-sm ${right ? 'border-good bg-good-soft' : chosen ? 'border-accent bg-accent-soft' : 'border-rule'}`}>
            <input type={multi ? 'checkbox' : 'radio'} name={item.id} checked={chosen} onChange={() => toggle(o.id)} className="mt-1" />
            <span>{o.text}</span>
          </label>
        )
      })}
    </fieldset>
  )
}

export function NumericView({ item, value, onChange, locked }: ViewProps<'numeric'>) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="number"
        inputMode="decimal"
        step="any"
        disabled={locked}
        aria-label="Đáp án số"
        value={Number.isNaN(value.value) ? '' : value.value}
        onChange={(e) => onChange({ type: 'numeric', value: e.target.value === '' ? Number.NaN : Number(e.target.value) })}
        className="num w-48 rounded-md border border-rule bg-paper px-2 py-1.5"
      />
      {item.unit && <span className="text-sm text-ink-2">{item.unit}</span>}
      <span className="text-xs text-ink-3">
        Dung sai: {item.tolerance.kind === 'rel' ? `±${item.tolerance.value * 100}%` : `±${item.tolerance.value}`}
      </span>
    </div>
  )
}

export function OrderingView({ item, value, onChange, locked }: ViewProps<'ordering'>) {
  const byId = useMemo(() => new Map(item.items.map((i) => [i.id, i.text])), [item])
  const move = (i: number, d: -1 | 1) => {
    const next = [...value.order]
    const j = i + d
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j] as string, next[i] as string]
    onChange({ type: 'ordering', order: next })
  }
  return (
    <ol className="space-y-1.5">
      {value.order.map((id, i) => (
        <li key={id} className="flex items-center gap-2 rounded-md border border-rule px-3 py-2 text-sm">
          <span className="num w-5 text-ink-3">{i + 1}.</span>
          <span className="flex-1">{byId.get(id)}</span>
          <button type="button" disabled={locked || i === 0} onClick={() => move(i, -1)} aria-label={`Đưa "${byId.get(id)}" lên`} className="rounded px-1.5 text-ink-2 hover:bg-paper-2 disabled:opacity-30">
            ↑
          </button>
          <button type="button" disabled={locked || i === value.order.length - 1} onClick={() => move(i, 1)} aria-label={`Đưa "${byId.get(id)}" xuống`} className="rounded px-1.5 text-ink-2 hover:bg-paper-2 disabled:opacity-30">
            ↓
          </button>
        </li>
      ))}
    </ol>
  )
}

export function ExplainView({ item, value, onChange, locked, explainExtra }: ViewProps<'explain'>) {
  return (
    <div className="space-y-3">
      <textarea
        rows={4}
        disabled={locked}
        aria-label="Giải thích của bạn"
        value={value.text}
        onChange={(e) => onChange({ ...value, text: e.target.value })}
        placeholder="Giải thích bằng lời của bạn…"
        className="w-full rounded-md border border-rule bg-paper p-2 text-sm"
      />
      <fieldset disabled={locked || value.text.trim().length === 0}>
        <legend className="text-xs font-medium text-ink-2">Tự chấm theo rubric (đánh dấu tiêu chí bài của bạn đạt):</legend>
        {item.rubric.map((r) => (
          <label key={r.id} className="mt-1 flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={value.checked.includes(r.id)}
              onChange={() => onChange({ ...value, checked: value.checked.includes(r.id) ? value.checked.filter((x) => x !== r.id) : [...value.checked, r.id] })}
            />
            {r.criterion}
          </label>
        ))}
      </fieldset>
      {explainExtra}
    </div>
  )
}

export function initialAnswer(item: QuizItem): QuizAnswer {
  switch (item.type) {
    case 'mcq':
      return { type: 'mcq', selected: [] }
    case 'numeric':
      return { type: 'numeric', value: Number.NaN }
    case 'ordering':
      return { type: 'ordering', order: seededShuffle(item.items.map((i) => i.id), item.id) }
    case 'explain':
      return { type: 'explain', text: '', checked: [] }
  }
}

export function canSubmit(a: QuizAnswer): boolean {
  if (a.type === 'mcq') return a.selected.length > 0
  if (a.type === 'numeric') return Number.isFinite(a.value)
  if (a.type === 'explain') return a.text.trim().length > 0
  return true
}
