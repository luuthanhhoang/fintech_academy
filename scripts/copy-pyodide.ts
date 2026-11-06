/** Copies the Pyodide runtime from node_modules into public/ so it is self-hosted (no CDN at runtime). */
import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(join(process.cwd(), 'package.json'))
const DEST = join(process.cwd(), 'public', 'pyodide')
const FILES = ['pyodide.mjs', 'pyodide.asm.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json']

function pyodideDir(): string {
  try {
    return dirname(require.resolve('pyodide/package.json'))
  } catch {
    console.error('✗ Không tìm thấy gói pyodide. Hãy cài phụ thuộc bằng `npm ci` (hoặc `yarn` với nodeLinker: node-modules, xem .yarnrc.yml).')
    process.exit(1)
  }
}

const SRC = pyodideDir()
if (!existsSync(join(SRC, 'pyodide.mjs'))) {
  console.error(`✗ Gói pyodide tại ${SRC} không có file thực (có thể đang dùng Yarn PnP — file nằm trong .zip). Dùng npm, hoặc đặt nodeLinker: node-modules trong .yarnrc.yml rồi cài lại.`)
  process.exit(1)
}

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
