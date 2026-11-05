import { loadContent, ContentLoadError } from '../lib/content/load'
import { validateContent } from '../lib/content/validate'
import { ICON_KEYS, PROVIDER_KINDS, SHORTCUT_ACTIONS, SIMULATOR_KEYS, SIMULATOR_PARAMS } from '../lib/registry/keys'

try {
  const bundle = loadContent()
  const issues = validateContent(bundle, { simulatorKeys: SIMULATOR_KEYS, simulatorParams: SIMULATOR_PARAMS, iconKeys: ICON_KEYS, shortcutActions: SHORTCUT_ACTIONS, providerKinds: PROVIDER_KINDS })
  if (issues.length > 0) {
    console.error(`✗ Nội dung có ${issues.length} lỗi:`)
    for (const i of issues) console.error(`  - [${i.where}] ${i.message}`)
    process.exit(1)
  }
  console.log(
    `✓ Nội dung hợp lệ: ${bundle.concepts.length} khái niệm, ${bundle.lessons.length} bài, ${bundle.planned.length} planned, ` +
      `${bundle.simulators.length} simulator, ${bundle.labs.length} lab, ${bundle.cases.length} case, ${bundle.sources.length} nguồn`,
  )
} catch (e) {
  if (e instanceof ContentLoadError) {
    console.error(`✗ ${e.message}`)
    process.exit(1)
  }
  throw e
}
