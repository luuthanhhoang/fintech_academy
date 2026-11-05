/** Local retrieval over tutor chunks (MiniSearch, Vietnamese-folded). No network, no embeddings. */
import MiniSearch from 'minisearch'
import { foldVietnamese, tokenize } from '../search/tokenize'
import type { TutorChunk } from './chunks'

export interface Retriever {
  search(query: string, topK: number, minScore: number): (TutorChunk & { score: number })[]
  byId(id: string): TutorChunk | undefined
}

export function createRetriever(chunks: readonly TutorChunk[]): Retriever {
  const index = new MiniSearch<TutorChunk>({
    fields: ['title', 'text', 'source'],
    storeFields: ['id'],
    tokenize,
    processTerm: (t) => foldVietnamese(t) || null,
  })
  index.addAll(chunks as TutorChunk[])
  const map = new Map(chunks.map((c) => [c.id, c]))
  return {
    search(query, topK, minScore) {
      return index
        .search(query, { boost: { title: 2 }, fuzzy: 0.2, prefix: true })
        .filter((r) => r.score >= minScore)
        .slice(0, topK)
        .map((r) => ({ ...(map.get(String(r.id)) as TutorChunk), score: r.score }))
    },
    byId: (id) => map.get(id),
  }
}
