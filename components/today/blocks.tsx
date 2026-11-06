'use client'

import type { ComponentType } from 'react'
import type { Catalog } from '@/lib/content/catalog'
import type { TodayBlockId } from '@/lib/content/schema/config'
import { logPractice, saveTodayDraft } from '@/lib/db/repos/activity'
import { LabEmbedById } from '@/components/lab/lab-by-id'
import { PracticeSession } from '@/components/practice/practice-session'
import { SelfExplainSection } from '@/components/reader/self-explain-section'
import { ReviewSession } from '@/components/review/review-session'
import { Button, LinkButton, minutes } from '@/components/ui/primitives'
import { EmptyState } from '@/components/ui/states'
import type { TodayData } from './use-today'

export interface BlockProps {
  catalog: Catalog
  today: TodayData
}

function ReviewsBlock({ catalog, today }: BlockProps) {
  if (today.plan.reviews.length === 0) return <p className="text-ink-2">Không có thẻ nào đến hạn hôm nay. Sang điểm dừng tiếp theo.</p>
  return <ReviewSession catalog={catalog} limit={today.plan.reviews.length} />
}

function LessonBlock({ today }: BlockProps) {
  const l = today.plan.lesson
  if (!l) return <EmptyState title="Bạn đã đi hết các bài đã viết trong lộ trình đang chọn.">Các bài còn lại đang ở trạng thái “dự kiến”.</EmptyState>
  return (
    <div>
      <p className="font-display text-xl font-semibold">{l.title.vi}</p>
      <p className="text-sm text-ink-3">{minutes(l.estMinutes)}</p>
      <p className="mt-3 border-l-4 pl-4 font-[family-name:var(--font-read)] text-lg italic text-ink-2" style={{ borderColor: `var(--line-${l.track})` }}>
        {l.whyQuestion}
      </p>
      <LinkButton href={`/lessons/${l.id}/`} variant="primary" className="mt-4">
        Bắt đầu học bài này
      </LinkButton>
    </div>
  )
}

function PracticeBlock({ catalog, today }: BlockProps) {
  const p = today.plan.practice
  if (!p) return <p className="text-sm text-ink-3">Chưa có bài tập phù hợp — hãy học một bài trước.</p>
  if (p.kind === 'lab') return <LabEmbedById id={p.id} />
  const lesson = catalog.lessons.find((l) => l.id === p.lessonId)
  const ex = lesson?.exercises.find((e) => e.id === p.id)
  if (!ex || !lesson) return null
  return (
    <div>
      <p className="text-xs text-ink-3">Từ bài: {lesson.title.vi}</p>
      <p className="mt-1 whitespace-pre-line">{ex.prompt}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <LinkButton href={`/lessons/${lesson.id}/#bai-tap`}>Mở bài tập (có gợi ý & lời giải)</LinkButton>
        <Button variant="primary" onClick={() => logPractice({ kind: 'exercise', refId: ex.id, conceptIds: [ex.conceptId], result: 'done', detail: 'today' })}>
          Đã làm xong
        </Button>
      </div>
    </div>
  )
}

function CaseBlock({ catalog, today }: BlockProps) {
  const c = catalog.cases.find((x) => x.id === today.plan.caseId)
  if (!c) return <p className="text-sm text-ink-3">Chưa có case study.</p>
  const q = c.questions[0]
  return (
    <div>
      <p className="font-display text-xl font-semibold">{c.title.vi}</p>
      <p className="text-sm text-ink-3">{c.period}</p>
      <p className="mt-2 text-sm">{c.summary}</p>
      {q && <p className="mt-2 font-medium">❓ {q.prompt}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <LinkButton href={`/cases/${c.id}/`} variant="primary">Đọc dòng thời gian & trả lời</LinkButton>
      </div>
    </div>
  )
}

function ExplainBlock({ today }: BlockProps) {
  const l = today.plan.explainLesson
  if (!l) return <p className="text-sm text-ink-3">Học xong một bài để có chủ đề tự giải thích.</p>
  const key = `explain:${l.id}`
  return (
    <SelfExplainSection
      key={key}
      targetId={l.id}
      conceptIds={l.concepts}
      prompt={`${l.title.vi}: ${l.selfExplain.prompt}`}
      rubric={l.selfExplain.rubric}
      draft={today.drafts[key]}
      onDraft={(t) => void saveTodayDraft(today.day, key, t)}
    />
  )
}

function InterleaveBlock({ catalog }: BlockProps) {
  return <PracticeSession catalog={catalog} limit={catalog.config.today.interleaveSize} />
}

/** Block id (from today.yaml) → component. */
export const TODAY_BLOCKS: Record<TodayBlockId, ComponentType<BlockProps>> = {
  reviews: ReviewsBlock,
  lesson: LessonBlock,
  practice: PracticeBlock,
  interleave: InterleaveBlock,
  case: CaseBlock,
  explain: ExplainBlock,
}
