import Link from 'next/link'
import { getContent } from '@/lib/content/server'
import { PageTitle } from '@/components/ui/primitives'

export const metadata = { title: 'Lộ trình' }

export default function TracksPage() {
  const { tracks, concepts, lessons, planned } = getContent()
  return (
    <>
      <PageTitle eyebrow="Bản đồ kỹ năng" title="Lộ trình" en="Tracks" />
      <div className="grid gap-4 font-sans md:grid-cols-2">
        {[...tracks].sort((a, b) => a.order - b.order).map((t) => (
          <Link key={t.id} href={`/tracks/${t.id}/`} className="rounded-xl border border-rule p-5 hover:bg-paper-2">
            <h2 className="font-serif text-2xl font-semibold">{t.title.vi}</h2>
            <p className="text-sm text-ink-3">{t.title.en}</p>
            <p className="mt-2 text-sm text-ink-2">{t.summary}</p>
            <p className="num mt-3 text-xs text-ink-3">
              {t.stages.length} chặng · {concepts.filter((c) => c.track === t.id).length} khái niệm · {lessons.filter((l) => l.track === t.id).length} bài đã viết · {planned.filter((p) => p.track === t.id).length} bài dự kiến
            </p>
          </Link>
        ))}
      </div>
    </>
  )
}
