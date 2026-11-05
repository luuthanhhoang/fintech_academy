'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { useState, type ReactNode } from 'react'
import type { RubricItem } from '@/lib/content/schema/common'
import { db } from '@/lib/db/dexie'
import { saveSelfExplain } from '@/lib/db/repos/activity'
import { Button } from '@/components/ui/primitives'

export interface SelfExplainProps {
  targetId: string
  conceptIds: string[]
  prompt: string
  rubric: RubricItem[]
  draft?: string
  onDraft?: (text: string) => void
  onSaved?: () => void
  /** Optional AI grading UI (only when the tutor is enabled). */
  aiSlot?: (text: string, onFeedback: (f: string) => void) => ReactNode
}

/** "Explain it back in your own words", self-graded against a rubric; optional AI feedback is stored alongside. */
export function SelfExplainBox({ targetId, conceptIds, prompt, rubric, draft, onDraft, onSaved, aiSlot }: SelfExplainProps) {
  const [text, setText] = useState(draft ?? '')
  const [checked, setChecked] = useState<string[]>([])
  const [ai, setAi] = useState<string | null>(null)
  const history = useLiveQuery(() => db().selfExplains.where('targetId').equals(targetId).reverse().sortBy('createdAt'), [targetId])

  const save = async () => {
    await saveSelfExplain({ targetId, conceptIds, text: text.trim(), checked, score: checked.length / rubric.length, aiFeedback: ai })
    setChecked([])
    setAi(null)
    onSaved?.()
  }

  return (
    <div className="font-sans">
      <p className="font-medium">{prompt}</p>
      <textarea
        rows={5}
        value={text}
        onChange={(e) => (setText(e.target.value), onDraft?.(e.target.value))}
        aria-label="Bài tự giải thích"
        placeholder="Giải thích như đang dạy lại cho một đồng nghiệp dev…"
        className="mt-2 w-full rounded-md border border-rule bg-paper p-2 text-sm"
      />
      <fieldset className="mt-2" disabled={!text.trim()}>
        <legend className="text-xs font-medium text-ink-2">Rubric tự đánh giá</legend>
        {rubric.map((r) => (
          <label key={r.id} className="mt-1 flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" checked={checked.includes(r.id)} onChange={() => setChecked((c) => (c.includes(r.id) ? c.filter((x) => x !== r.id) : [...c, r.id]))} />
            {r.criterion}
          </label>
        ))}
      </fieldset>
      {aiSlot?.(text, setAi)}
      {ai && <div className="mt-3 whitespace-pre-wrap rounded-md bg-accent-soft p-3 text-sm">{ai}</div>}
      <p className="num mt-2 text-xs text-ink-3">Điểm tự chấm: {checked.length}/{rubric.length}</p>
      <Button variant="primary" className="mt-2" disabled={!text.trim()} onClick={save}>
        Lưu bài tự giải thích
      </Button>
      {history && history.length > 0 && (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-ink-2">Các lần trước ({history.length})</summary>
          <ul className="mt-2 space-y-2">
            {history.map((h) => (
              <li key={h.id} className="rounded-md border border-rule p-2">
                <p className="num text-xs text-ink-3">
                  {h.createdAt.toLocaleString('vi-VN')} · {Math.round(h.score * 100)}%
                </p>
                <p className="whitespace-pre-wrap">{h.text}</p>
                {h.aiFeedback && <p className="mt-1 whitespace-pre-wrap text-xs text-ink-2">AI: {h.aiFeedback}</p>}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
