'use client'

import { useEffect, useState } from 'react'
import type { TutorChunk } from '@/lib/tutor/chunks'
import { createRetriever, type Retriever } from '@/lib/tutor/retrieval'

let cached: Promise<Retriever> | null = null

function load(): Promise<Retriever> {
  cached ??= fetch('/data/tutor-chunks.json', { cache: 'no-cache' })
    .then((r) => {
      if (!r.ok) throw new Error(`Không tải được kho nội dung cho gia sư (HTTP ${r.status})`)
      return r.json() as Promise<TutorChunk[]>
    })
    .then(createRetriever)
  cached.catch(() => (cached = null))
  return cached
}

export function useRetriever(enabled: boolean) {
  const [state, setState] = useState<{ retriever: Retriever | null; error: Error | null }>({ retriever: null, error: null })
  useEffect(() => {
    if (!enabled) return
    load().then(
      (retriever) => setState({ retriever, error: null }),
      (e: unknown) => setState({ retriever: null, error: e instanceof Error ? e : new Error(String(e)) }),
    )
  }, [enabled])
  return state
}
