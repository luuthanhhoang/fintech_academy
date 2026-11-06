import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getContent } from '@/lib/content/server'
import { LabWorkbench } from '@/components/lab/lab-runner'
import { PageTitle } from '@/components/ui/primitives'

export const dynamicParams = false
export function generateStaticParams() {
  return getContent().labs.map((l) => ({ id: l.id }))
}

export default async function LabPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lab = getContent().labs.find((l) => l.id === id)
  if (!lab) notFound()
  return (
    <>
      <PageTitle eyebrow={<Link href="/labs/" className="hover:underline">← Code lab</Link>} title={lab.title.vi} en={lab.title.en} lead={lab.summary} />
      <section className="mb-6 whitespace-pre-line rounded-lg border border-rule bg-paper-2 p-4 font-sans text-sm">{lab.instructions}</section>
      <LabWorkbench lab={lab} />
    </>
  )
}
