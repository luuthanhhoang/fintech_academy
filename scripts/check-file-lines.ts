/**
 * Fails when any tracked source/content file exceeds the line limit.
 * Scans the repo tree, skipping generated/vendor directories.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, extname } from 'node:path'

const MAX_LINES = 500
const ROOT = process.cwd()
const SKIP_DIRS = new Set(['node_modules', '.next', 'out', '.generated', '.git', 'pyodide', 'generated'])
const SKIP_FILES = new Set(['package-lock.json'])
const EXTENSIONS = new Set(['.ts', '.tsx', '.mjs', '.js', '.css', '.md', '.mdx', '.yaml', '.yml', '.json', '.py'])

function* walk(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) yield* walk(full)
    else if (EXTENSIONS.has(extname(name)) && !SKIP_FILES.has(name)) yield full
  }
}

const violations: string[] = []
for (const file of walk(ROOT)) {
  const lines = readFileSync(file, 'utf8').split('\n').length
  if (lines > MAX_LINES) violations.push(`${relative(ROOT, file)}: ${lines} dòng`)
}

if (violations.length > 0) {
  console.error(`✗ ${violations.length} file vượt ${MAX_LINES} dòng:\n  ${violations.join('\n  ')}`)
  process.exit(1)
}
console.log(`✓ Mọi file ≤ ${MAX_LINES} dòng`)
