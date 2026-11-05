'use client'

import type { RubricItem } from '@/lib/content/schema/common'
import { logPractice } from '@/lib/db/repos/activity'
import { SelfExplainSection } from '@/components/reader/self-explain-section'

export function CaseQuestions({ caseId, conceptIds, questions }: { caseId: string; conceptIds: string[]; questions: { id: string; prompt: string; rubric: RubricItem[] }[] }) {
  return (
    <div className="mt-3 space-y-6">
      {questions.map((q) => (
        <div key={q.id} className="rounded-lg border border-rule p-4">
          <SelfExplainSection
            targetId={`case:${caseId}:${q.id}`}
            conceptIds={conceptIds}
            prompt={q.prompt}
            rubric={q.rubric}
            onSaved={() => void logPractice({ kind: 'case', refId: caseId, conceptIds, result: 'done', detail: q.id })}
          />
        </div>
      ))}
    </div>
  )
}
