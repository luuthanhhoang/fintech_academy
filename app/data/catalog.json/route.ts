import { catalogArtefact } from '@/lib/content/artefacts'
import { getContent } from '@/lib/content/server'

export const dynamic = 'force-static'

export function GET() {
  return Response.json(catalogArtefact(getContent()))
}
