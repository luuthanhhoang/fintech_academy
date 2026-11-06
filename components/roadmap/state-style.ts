import type { ConceptState } from '@/lib/mastery/state'

/** Visual encoding per state: color + glyph (never color alone). */
export const STATE_STYLE: Record<ConceptState, { cls: string; glyph: string; border: string }> = {
  planned: { cls: 'bg-paper-2 text-ink-3', glyph: '○', border: 'var(--rule)' },
  available: { cls: 'bg-paper text-ink', glyph: '◇', border: 'var(--accent)' },
  learning: { cls: 'bg-accent-soft text-accent', glyph: '◐', border: 'var(--accent)' },
  mastered: { cls: 'bg-good-soft text-good', glyph: '●', border: 'var(--good)' },
}
