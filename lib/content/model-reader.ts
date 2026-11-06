/** Node-only: reads model summaries from public/models for the content validator (scripts and tests). */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { readGlbSummary, type GlbSummary } from '../world/glb'

export function modelReader(root: string = process.cwd()): (file: string) => GlbSummary | null {
  return (file) => {
    const path = join(root, 'public', 'models', file)
    return existsSync(path) ? readGlbSummary(new Uint8Array(readFileSync(path))) : null
  }
}
