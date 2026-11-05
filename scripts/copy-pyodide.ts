/** Copies the Pyodide runtime from node_modules into public/ so it is self-hosted (no CDN at runtime). */
import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const SRC = join(process.cwd(), 'node_modules', 'pyodide')
const DEST = join(process.cwd(), 'public', 'pyodide')
const FILES = ['pyodide.mjs', 'pyodide.asm.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json']

mkdirSync(DEST, { recursive: true })
for (const file of FILES) {
  const from = join(SRC, file)
  if (!existsSync(from)) {
    console.error(`✗ Thiếu ${file} trong gói pyodide`)
    process.exit(1)
  }
  cpSync(from, join(DEST, file))
}
console.log(`✓ Đã chép Pyodide vào public/pyodide`)
