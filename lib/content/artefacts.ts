/**
 * Data the browser loads at runtime (catalog, search index, tutor chunks, labs), built from the content bundle.
 * Served by static route handlers under app/generated: computed per request in dev (always current with the
 * content and code), emitted as files by `next build` (output: 'export').
 */
import MiniSearch from 'minisearch'
import { buildSearchDocs } from '../search/build'
import { indexOptions } from '../search/options'
import { buildTutorChunks } from '../tutor/chunks'
import { buildCatalog } from './catalog'
import type { ContentBundle } from './types'

export const catalogArtefact = (b: ContentBundle) => buildCatalog(b)

export function searchIndexArtefact(b: ContentBundle) {
  const search = new MiniSearch(indexOptions(b.config.search))
  search.addAll(buildSearchDocs(b))
  return search.toJSON()
}

export const tutorChunksArtefact = (b: ContentBundle) => buildTutorChunks(b)

export const labArtefact = (b: ContentBundle, id: string) => b.labs.find((l) => l.id === id) ?? null
