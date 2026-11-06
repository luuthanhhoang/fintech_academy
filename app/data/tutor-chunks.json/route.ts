import { tutorChunksArtefact } from '@/lib/content/artefacts'
import { getContent } from '@/lib/content/server'

export const dynamic = 'force-static'

export function GET() {
  return Response.json(tutorChunksArtefact(getContent()))
}
