/** Emits build-time artefacts consumed by client features: catalog, search index, tutor chunks. */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import MiniSearch from 'minisearch'
import { buildCatalog } from '../lib/content/catalog'
import { loadContent } from '../lib/content/load'
import { buildSearchDocs } from '../lib/search/build'
import { indexOptions } from '../lib/search/options'
import { buildTutorChunks } from '../lib/tutor/chunks'

const OUT = join(process.cwd(), 'public', 'generated')
mkdirSync(OUT, { recursive: true })

const bundle = loadContent()
const write = (name: string, data: unknown) => writeFileSync(join(OUT, name), JSON.stringify(data))

write('catalog.json', buildCatalog(bundle))

mkdirSync(join(OUT, 'labs'), { recursive: true })
for (const lab of bundle.labs) write(`labs/${lab.id}.json`, lab)

const docs = buildSearchDocs(bundle)
const search = new MiniSearch(indexOptions(bundle.config.search))
search.addAll(docs)
write('search-index.json', search.toJSON())

const chunks = buildTutorChunks(bundle)
write('tutor-chunks.json', chunks)

console.log(`✓ Đã dựng catalog, ${docs.length} tài liệu tìm kiếm, ${chunks.length} đoạn cho gia sư`)
