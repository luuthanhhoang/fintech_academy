import { notFound } from 'next/navigation'
import { getContent } from '@/lib/content/server'
import { TrackPageClient } from './client'
import { PageTitle } from '@/components/ui/primitives'

export const dynamicParams = false
export function generateStaticParams() {
  return getContent().tracks.map((t) => ({ track: t.id }))
}

export default async function TrackPage({ params }: { params: Promise<{ track: string }> }) {
  const { track } = await params
  const t = getContent().tracks.find((x) => x.id === track)
  if (!t) notFound()
  return (
    <>
      <PageTitle eyebrow="Lộ trình" title={t.title.vi} en={t.title.en} lead={t.summary} />
      <TrackPageClient trackId={t.id} />
    </>
  )
}
