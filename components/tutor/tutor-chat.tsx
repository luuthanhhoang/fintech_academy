'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo, useRef, useState } from 'react'
import type { Catalog } from '@/lib/content/catalog'
import type { TutorMessage } from '@/lib/tutor/provider'
import { runTurn, type TurnResult } from '@/lib/tutor/session'
import { useMastery } from '@/components/data/use-learner'
import { Button, LinkButton } from '@/components/ui/primitives'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/states'
import { TutorAnswer } from './answer'
import { useRetriever } from './use-retriever'
import { useTutor } from './use-tutor'

type Entry = { q: string; turn: TurnResult | null; error: string | null }
const WEAK_LIMIT = 5

/** `?mode=<id>` preselects a tutor mode defined in tutor.yaml. */
export function TutorChat({ catalog }: { catalog: Catalog }) {
  const params = useSearchParams()
  const tutor = useTutor(catalog)
  const { retriever, error } = useRetriever(tutor.status === 'ready')
  const mastery = useMastery(catalog)
  const cfg = catalog.config.tutor
  const asked = params.get('mode')
  const [modeId, setModeId] = useState(cfg.modes.find((m) => m.id === asked)?.id ?? cfg.modes[0]?.id ?? '')
  const [lessonId, setLessonId] = useState(catalog.lessons[0]?.id ?? '')
  const [q, setQ] = useState('')
  const [entries, setEntries] = useState<Entry[]>([])
  const history = useRef<TutorMessage[]>([])
  const abort = useRef<AbortController | null>(null)
  const mode = cfg.modes.find((m) => m.id === modeId)

  const weak = useMemo(() => {
    if (mastery.status !== 'ready') return []
    return catalog.concepts
      .filter((c) => mastery.learnable.has(c.id) && ['learning', 'available'].includes(mastery.states.get(c.id) ?? ''))
      .map((c) => ({ id: c.id, name: c.name.vi, score: mastery.scores.get(c.id)?.score ?? null }))
      .sort((a, b) => (a.score ?? -1) - (b.score ?? -1))
      .slice(0, WEAK_LIMIT)
  }, [catalog, mastery])

  if (tutor.status === 'loading') return <Skeleton lines={4} />
  if (tutor.status !== 'ready')
    return (
      <EmptyState title={tutor.status === 'disabled' ? 'Gia sư AI đang tắt' : 'Chưa cấu hình API key / model'} action={<LinkButton href="/settings/" variant="primary">Mở Cài đặt</LinkButton>}>
        Gia sư là tuỳ chọn. Mọi tính năng khác (bài học, quiz, ôn tập, mô phỏng, lab) chạy đầy đủ khi không có key.
      </EmptyState>
    )
  if (error) return <ErrorState error={error} />
  if (!retriever || !mode) return <Skeleton lines={4} />

  const lesson = catalog.lessons.find((l) => l.id === lessonId)
  const send = async () => {
    const question = q.trim()
    if (!question) return
    setQ('')
    const idx = entries.length
    setEntries((e) => [...e, { q: question, turn: null, error: null }])
    abort.current = new AbortController()
    const weakNames = weak.map((w) => w.name).join(' ')
    try {
      const turn = await runTurn({
        provider: tutor.provider, model: tutor.model, cfg, mode, retriever, history: history.current, question, signal: abort.current.signal,
        retrievalQuery: mode.needs.includes('weakConcepts') ? `${question} ${weakNames}` : mode.needs.includes('rubric') && lesson ? `${lesson.title.vi} ${lesson.selfExplain.prompt} ${question}` : question,
        context: { weakConcepts: weak, rubric: lesson ? { prompt: lesson.selfExplain.prompt, items: lesson.selfExplain.rubric } : undefined },
      })
      history.current = turn.history
      setEntries((e) => e.map((x, i) => (i === idx ? { ...x, turn } : x)))
    } catch (err) {
      setEntries((e) => e.map((x, i) => (i === idx ? { ...x, error: err instanceof Error ? err.message : String(err) } : x)))
    }
  }

  return (
    <div className="font-sans">
      <div className="mb-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Chế độ gia sư">
        {cfg.modes.map((m) => (
          <button key={m.id} type="button" role="radio" aria-checked={m.id === modeId} onClick={() => setModeId(m.id)} className="rounded-md border border-rule px-3 py-1.5 text-sm aria-checked:border-accent aria-checked:bg-accent-soft" title={m.description}>
            {m.label}
          </button>
        ))}
      </div>
      <p className="mb-3 text-sm text-ink-2">{mode.description}</p>
      {mode.needs.includes('weakConcepts') && (
        <p className="mb-3 text-xs text-ink-3">Khái niệm yếu nhất (từ dữ liệu thật): {weak.length ? weak.map((w) => w.name).join(', ') : 'chưa có — hãy làm vài quiz trước.'}</p>
      )}
      {mode.needs.includes('rubric') && (
        <label className="mb-3 flex items-center gap-2 text-sm">
          Rubric của bài
          <select value={lessonId} onChange={(e) => setLessonId(e.target.value)} className="rounded-md border border-rule bg-paper px-2 py-1">
            {catalog.lessons.map((l) => <option key={l.id} value={l.id}>{l.title.vi}</option>)}
          </select>
        </label>
      )}
      <ol className="space-y-4">
        {entries.map((e, i) => (
          <li key={i} className="space-y-2">
            <p className="ml-auto max-w-[85%] rounded-lg bg-accent-soft px-3 py-2 text-sm">{e.q}</p>
            <div className="rounded-lg border border-rule p-3">
              {e.error ? <ErrorState title="Lỗi khi gọi nhà cung cấp" error={e.error} /> : e.turn ? <TutorAnswer turn={e.turn} insufficientText={cfg.insufficientText} /> : <Skeleton lines={3} />}
            </div>
          </li>
        ))}
      </ol>
      <div className="sticky bottom-16 mt-4 flex gap-2 bg-paper py-2 lg:bottom-0">
        <textarea value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.metaKey || e.ctrlKey) && send()} rows={2} placeholder={mode.placeholder} aria-label="Câu hỏi cho gia sư" className="flex-1 rounded-md border border-rule bg-paper p-2 text-sm" />
        <div className="flex flex-col gap-1">
          <Button variant="primary" onClick={send} disabled={!q.trim()}>Gửi</Button>
          <Button variant="ghost" onClick={() => { abort.current?.abort(); history.current = []; setEntries([]) }}>Mới</Button>
        </div>
      </div>
      <p className="mt-1 text-xs text-ink-3">Gia sư chỉ trả lời từ nội dung của site và phải trích dẫn; số liệu được tính bằng công cụ trong lib/finance. <Link href="/settings/" className="underline">Cài đặt</Link></p>
    </div>
  )
}
