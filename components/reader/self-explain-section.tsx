'use client'

import type { RubricItem } from '@/lib/content/schema/common'
import { useAiGradeSlot } from '@/components/tutor/ai-grade'
import { SelfExplainBox, type SelfExplainProps } from './self-explain'

/** Self-explanation with optional AI grading when the BYOK tutor is enabled. */
export function SelfExplainSection(props: { targetId: string; conceptIds: string[]; prompt: string; rubric: RubricItem[] } & Pick<SelfExplainProps, 'draft' | 'onDraft' | 'onSaved'>) {
  const aiSlot = useAiGradeSlot(props.prompt, props.rubric, props.conceptIds)
  return <SelfExplainBox {...props} aiSlot={aiSlot} />
}
