import type { Options } from 'minisearch'
import type { SearchConfig } from '../content/schema/config'
import { foldVietnamese, tokenize } from './tokenize'

export interface SearchDoc {
  id: string
  kind: string
  title: string
  titleEn: string
  text: string
  tags: string
  href: string
}

export const STORE_FIELDS = ['kind', 'title', 'titleEn', 'href', 'text'] as const

export function indexOptions(cfg: SearchConfig): Options<SearchDoc> {
  return {
    fields: cfg.fields,
    storeFields: [...STORE_FIELDS],
    tokenize,
    processTerm: (t) => foldVietnamese(t) || null,
  }
}

export function queryOptions(cfg: SearchConfig) {
  return { boost: cfg.boost, fuzzy: cfg.fuzzy, prefix: cfg.prefix }
}

/** Short excerpt around the first matched term. */
export function excerpt(text: string, terms: readonly string[], radius = 70): string {
  const folded = foldVietnamese(text)
  const hit = terms
    .map((t) => folded.indexOf(t))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b)[0]
  if (hit === undefined) return text.slice(0, radius * 2) + (text.length > radius * 2 ? '…' : '')
  const start = Math.max(0, hit - radius)
  return (start > 0 ? '…' : '') + text.slice(start, hit + radius) + (hit + radius < text.length ? '…' : '')
}
