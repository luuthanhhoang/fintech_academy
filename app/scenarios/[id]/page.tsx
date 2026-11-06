import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getContent } from '@/lib/content/server'
import { ScenarioPlayer } from '@/components/learn/scenario'
import { PageTitle } from '@/components/ui/primitives'

export const dynamicParams = false
export function generateStaticParams() {
  return getContent().scenarios.map((s) => ({ id: s.id }))
}

export default async function ScenarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const b = getContent()
  const sc = b.scenarios.find((s) => s.id === id)
  if (!sc) notFound()
  const lessons = b.lessons.filter((l) => l.scenarios.includes(sc.id))
  return (
    <>
      <PageTitle eyebrow={<Link href="/scenarios/" className="hover:underline">← Tình huống nhập vai</Link>} title={sc.title.vi} en={sc.title.en} lead={sc.summary} />
      <ScenarioPlayer scenario={sc} />
      <p className="font-sans text-sm">
        Học lý thuyết: {lessons.map((l) => <Link key={l.id} href={`/lessons/${l.id}/`} className="mr-3 text-accent underline">{l.title.vi}</Link>)}
      </p>
    </>
  )
}
