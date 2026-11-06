import { labArtefact } from '@/lib/content/artefacts'
import { getContent } from '@/lib/content/server'

export const dynamic = 'force-static'
export const dynamicParams = false

/** One file per lab: /data/labs/<id>.json */
export function generateStaticParams() {
  return getContent().labs.map((l) => ({ file: `${l.id}.json` }))
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const lab = labArtefact(getContent(), (await params).file.replace(/\.json$/, ''))
  return lab ? Response.json(lab) : new Response('Not found', { status: 404 })
}
