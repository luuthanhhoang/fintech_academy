/** Builds the system prompt for a tutor mode from content config + retrieved passages + mode context. */
import type { TutorConfig, TutorMode } from '../content/schema/config'
import type { RubricItem } from '../content/schema/common'
import type { TutorChunk } from './chunks'

export interface ModeContext {
  weakConcepts?: { id: string; name: string; score: number | null }[]
  rubric?: { prompt: string; items: RubricItem[] }
}

const escape = (s: string) => s.replace(/</g, '‹').replace(/>/g, '›')

export function buildSystemPrompt(cfg: TutorConfig, mode: TutorMode, passages: readonly TutorChunk[], ctx: ModeContext): string {
  const parts = [cfg.baseSystem, `Chế độ: ${mode.label}. ${mode.system}`]
  parts.push(
    '<passages>\n' +
      passages.map((p) => `<passage id="${p.id}" title="${escape(p.title)}" source="${escape(p.source)}">\n${escape(p.text)}\n</passage>`).join('\n') +
      '\n</passages>',
  )
  if (mode.needs.includes('weakConcepts') && ctx.weakConcepts) {
    parts.push('<weak_concepts>\n' + ctx.weakConcepts.map((c) => `- ${c.id}: ${c.name} (điểm: ${c.score === null ? 'chưa có dữ liệu' : c.score.toFixed(2)})`).join('\n') + '\n</weak_concepts>')
  }
  if (mode.needs.includes('rubric') && ctx.rubric) {
    parts.push(`<rubric prompt="${escape(ctx.rubric.prompt)}">\n` + ctx.rubric.items.map((r) => `- [${r.id}] ${r.criterion}`).join('\n') + '\n</rubric>')
  }
  return parts.join('\n\n')
}
