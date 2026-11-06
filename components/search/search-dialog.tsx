'use client'

import MiniSearch, { type SearchResult } from 'minisearch'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import type { SearchConfig } from '@/lib/content/schema/config'
import { excerpt, indexOptions, queryOptions, type SearchDoc } from '@/lib/search/options'
import { tokenize } from '@/lib/search/tokenize'
import { useCatalogState } from '@/components/data/catalog-provider'
import { Dialog } from '@/components/layout/dialog'
import { ErrorState, Skeleton } from '@/components/ui/states'

type IndexState = { status: 'loading' } | { status: 'error'; error: Error } | { status: 'ready'; index: MiniSearch<SearchDoc> }

let cached: Promise<MiniSearch<SearchDoc>> | null = null

function loadIndex(cfg: SearchConfig) {
  cached ??= fetch('/generated/search-index.json', { cache: 'no-cache' })
    .then((r) => {
      if (!r.ok) throw new Error(`Không tải được chỉ mục (HTTP ${r.status})`)
      return r.text()
    })
    .then((json) => MiniSearch.loadJSON<SearchDoc>(json, indexOptions(cfg)))
  cached.catch(() => {
    cached = null
  })
  return cached
}

function useIndex(cfg: SearchConfig | null): IndexState {
  const [state, setState] = useState<IndexState>({ status: 'loading' })
  useEffect(() => {
    if (!cfg) return
    loadIndex(cfg).then(
      (index) => setState({ status: 'ready', index }),
      (e: unknown) => setState({ status: 'error', error: e instanceof Error ? e : new Error(String(e)) }),
    )
  }, [cfg])
  return state
}

type Hit = SearchResult & Pick<SearchDoc, 'kind' | 'title' | 'titleEn' | 'href' | 'text'>

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const catalog = useCatalogState()
  const cfg = catalog.status === 'ready' ? catalog.catalog.config.search : null
  const index = useIndex(cfg)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const router = useRouter()

  const hits = useMemo<Hit[]>(() => {
    if (index.status !== 'ready' || !cfg || !q.trim()) return []
    return (index.index.search(q, queryOptions(cfg)) as Hit[]).slice(0, cfg.resultLimit)
  }, [index, cfg, q])
  const terms = useMemo(() => tokenize(q), [q])

  const go = (hit: Hit | undefined) => {
    if (!hit) return
    onClose()
    router.push(hit.href)
  }

  return (
    <Dialog open={open} onClose={onClose} label="Tìm kiếm toàn site" className="mt-[10vh] mb-auto">
      <div className="border-b border-rule p-3">
        <input
          autoFocus
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setActive(0)
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') setActive((a) => Math.min(a + 1, hits.length - 1))
            if (e.key === 'ArrowUp') setActive((a) => Math.max(a - 1, 0))
            if (e.key === 'Enter') go(hits[active])
          }}
          placeholder="Tìm bài, khái niệm, mô phỏng… (gõ không dấu cũng được)"
          aria-label="Từ khoá tìm kiếm"
          role="combobox"
          aria-expanded={hits.length > 0}
          aria-controls="search-results"
          className="w-full bg-transparent px-2 py-1.5 text-base outline-none"
        />
      </div>
      <div className="max-h-[60vh] overflow-y-auto p-2">
        {index.status === 'loading' && <Skeleton lines={3} className="p-3" />}
        {index.status === 'error' && <ErrorState error={index.error} />}
        {index.status === 'ready' && q.trim() && hits.length === 0 && <p className="p-4 text-sm text-ink-3">Không có kết quả cho “{q}”.</p>}
        {index.status === 'ready' && !q.trim() && <p className="p-4 text-sm text-ink-3">Nhập từ khoá. Dùng ↑ ↓ để chọn, Enter để mở.</p>}
        <ul id="search-results" role="listbox" aria-label="Kết quả">
          {hits.map((h, i) => (
            <li key={h.id} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => go(h)}
                className={`w-full rounded-md px-3 py-2 text-left ${i === active ? 'bg-accent-soft' : ''}`}
              >
                <span className="text-[0.7rem] text-ink-3">{cfg?.kindLabels[h.kind] ?? h.kind}</span>
                <span className="block font-medium">
                  {h.title} {h.titleEn && <span className="text-sm font-normal text-ink-3">· {h.titleEn}</span>}
                </span>
                <span className="block text-sm text-ink-2">{excerpt(h.text, terms)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Dialog>
  )
}
