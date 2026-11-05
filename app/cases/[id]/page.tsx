import { notFound } from 'next/navigation'
import { getContent, sourcesById } from '@/lib/content/server'
import { CaseView } from '@/components/case/case-view'
import { PageTitle } from '@/components/ui/primitives'

export const dynamicParams = false
export function generateStaticParams() {
  return getContent().cases.map((c) => ({ id: c.id }))
}

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cs = getContent().cases.find((c) => c.id === id)
  if (!cs) notFound()
  const ids = [...new Set([...cs.timeline.flatMap((e) => e.sourceIds), ...cs.rootCauses.flatMap((r) => r.sourceIds)])]
  return (
    <>
      <PageTitle eyebrow={`Case study · ${cs.period}`} title={cs.title.vi} en={cs.title.en} lead={cs.summary} />
      <CaseView cs={cs} sources={sourcesById(ids)} />
    </>
  )
}
