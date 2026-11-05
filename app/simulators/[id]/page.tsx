import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { getContent } from '@/lib/content/server'
import { SimulatorFromQuery } from '@/components/simulators/from-query'
import { PageTitle } from '@/components/ui/primitives'
import { Skeleton } from '@/components/ui/states'

export const dynamicParams = false
export function generateStaticParams() {
  return getContent().simulators.map((s) => ({ id: s.id }))
}

export default async function SimulatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const b = getContent()
  const meta = b.simulators.find((s) => s.id === id)
  if (!meta) notFound()
  const lessons = b.lessons.filter((l) => l.simulators.includes(meta.id))
  return (
    <>
      <PageTitle eyebrow="Mô phỏng" title={meta.title.vi} en={meta.title.en} lead={meta.summary} />
      <Suspense fallback={<Skeleton lines={8} />}>
        <SimulatorFromQuery meta={meta} syntheticLabel={b.config.site.syntheticLabel} />
      </Suspense>
      {meta.syntheticNote && <p className="font-sans text-xs text-ink-3">Về dữ liệu: {meta.syntheticNote}</p>}
      <p className="mt-4 font-sans text-sm">
        Học lý thuyết: {lessons.map((l) => <Link key={l.id} href={`/lessons/${l.id}/`} className="mr-3 text-accent underline">{l.title.vi}</Link>)}
      </p>
    </>
  )
}
