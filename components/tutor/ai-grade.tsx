'use client'

import { useState, type ReactNode } from 'react'
import type { RubricItem } from '@/lib/content/schema/common'
import { runTurn } from '@/lib/tutor/session'
import { useCatalogState } from '@/components/data/catalog-provider'
import { Button } from '@/components/ui/primitives'
import { useRetriever } from './use-retriever'
import { useTutor } from './use-tutor'

const GRADE_MODE = 'grade'

/** Returns an AI-grading slot for self-explanations when the tutor is enabled and has a key; otherwise undefined. */
export function useAiGradeSlot(prompt: string, rubric: RubricItem[], conceptIds: string[]) {
  const catalog = useCatalogState()
  const cat = catalog.status === 'ready' ? catalog.catalog : null
  const tutor = useTutor(cat)
  const ready = tutor.status === 'ready'
  const { retriever } = useRetriever(ready)
  const mode = cat?.config.tutor.modes.find((m) => m.id === GRADE_MODE)
  if (!ready || !retriever || !mode || !cat) return undefined
  const conceptNames = conceptIds.map((c) => cat.concepts.find((x) => x.id === c)?.name.vi ?? c).join(' ')
  return function AiSlot(text: string, onFeedback: (f: string) => void): ReactNode {
    return <AiGradeButton text={text} onFeedback={onFeedback} run={(t) => runTurn({ provider: tutor.provider, model: tutor.model, cfg: cat.config.tutor, mode, retriever, history: [], question: t, retrievalQuery: `${prompt} ${conceptNames} ${t}`, context: { rubric: { prompt, items: rubric } } })} />
  }
}

function AiGradeButton({ text, onFeedback, run }: { text: string; onFeedback: (f: string) => void; run: (t: string) => ReturnType<typeof runTurn> }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const go = async () => {
    setBusy(true)
    setError(null)
    try {
      const r = await run(text)
      const note = r.citations.grounded ? '' : '\n\n⚠ Phản hồi không có trích dẫn hợp lệ tới nội dung site — hãy xem như tham khảo.'
      onFeedback(r.text + note)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="mt-2">
      <Button onClick={go} disabled={busy || !text.trim()}>
        {busy ? 'Gia sư AI đang chấm…' : '✦ Nhờ gia sư AI chấm thêm'}
      </Button>
      {error && <p role="alert" className="mt-1 text-xs text-bad">{error}</p>}
    </div>
  )
}
