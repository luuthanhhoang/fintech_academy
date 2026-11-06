import { loadContent, ContentLoadError } from '../lib/content/load'
import { validateContent } from '../lib/content/validate'
import { VALIDATE_OPTIONS } from '../lib/registry/validate-options'

try {
  const bundle = loadContent()
  const issues = validateContent(bundle, VALIDATE_OPTIONS)
  if (issues.length > 0) {
    console.error(`✗ Nội dung có ${issues.length} lỗi:`)
    for (const i of issues) console.error(`  - [${i.where}] ${i.message}`)
    process.exit(1)
  }
  console.log(
    `✓ Nội dung hợp lệ: ${bundle.concepts.length} khái niệm, ${bundle.lessons.length} bài, ${bundle.planned.length} planned, ` +
      `${bundle.simulators.length} simulator, ${bundle.labs.length} lab, ${bundle.cases.length} case, ${bundle.scenarios.length} tình huống, ` +
      `${bundle.lessons.reduce((a, l) => a + l.examples.length, 0)} ví dụ từng bước, ${bundle.lessons.reduce((a, l) => a + l.diagrams.length, 0)} sơ đồ, ${bundle.sources.length} nguồn`,
  )
} catch (e) {
  if (e instanceof ContentLoadError) {
    console.error(`✗ ${e.message}`)
    process.exit(1)
  }
  throw e
}
