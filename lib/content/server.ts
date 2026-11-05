/** Server/build-time access to content with a per-process cache. Never import from client components. */
import 'server-only'
import { loadContent } from './load'
import type { ContentBundle } from './types'

let cache: ContentBundle | null = null

export function getContent(): ContentBundle {
  if (!cache || process.env.NODE_ENV === 'development') cache = loadContent()
  return cache
}

export function getLesson(id: string) {
  return getContent().lessons.find((l) => l.id === id) ?? null
}

export function sourcesById(ids: readonly string[]) {
  const all = getContent().sources
  return ids.map((id) => all.find((s) => s.id === id)).filter((s) => s !== undefined)
}
