import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getContent } from '@/lib/content/server'
import { Tag } from '@/components/ui/badges'
import { PageTitle } from '@/components/ui/primitives'
import { ConceptPageClient } from './client'

export const dynamicParams = false
export function generateStaticParams() {
  return getContent().concepts.map((c) => ({ id: c.id }))
}

export default async function ConceptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const b = getContent()
  const c = b.concepts.find((x) => x.id === id)
  if (!c) notFound()
  const track = b.tracks.find((t) => t.id === c.track)
  const stage = track?.stages.find((s) => s.id === c.stage)
  return (
    <>
      <PageTitle eyebrow={`Khái niệm · ${stage?.title.vi ?? ''}`} title={c.name.vi} en={c.name.en} lead={c.short} />
      <div className="mb-6 flex flex-wrap gap-2 font-sans text-xs text-ink-3">
        <span>Độ khó {c.difficulty}/5</span>
        {c.tags.map((t) => <Tag key={t}>{t}</Tag>)}
        <Link href={`/tracks/${c.track}/#${c.stage}`} className="text-accent underline">Xem trên lộ trình</Link>
      </div>
      <ConceptPageClient id={c.id} />
    </>
  )
}
