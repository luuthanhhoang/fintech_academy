import type { Fact } from '@/lib/content/schema/lesson'
import type { Source } from '@/lib/content/schema/source'

/** Real-world figure with its source. Unverified facts never show a value (principle 2). */
export function FactInline({ fact, source }: { fact: Fact; source: Source | undefined }) {
  const verified = fact.status === 'verified'
  return (
    <span className={`rounded px-1 font-sans text-[0.95em] ${verified ? 'bg-good-soft' : 'bg-warn-soft'}`}>
      {fact.text}
      {verified && fact.value ? <strong className="num ml-1">{fact.value}</strong> : <em className="ml-1 text-warn">[chưa kiểm chứng — không nêu số]</em>}
      {source && (
        <a href={source.url} target="_blank" rel="noreferrer" className="ml-1 align-super text-[0.7em] text-accent" title={`${source.publisher} · số liệu tính đến ${fact.asOf}`}>
          [{source.publisher}]
        </a>
      )}
    </span>
  )
}
