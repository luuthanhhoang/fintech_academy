/** Render environment shared by every book module. */
import type { ContentBundle } from '../../lib/content/types'
import type { Concept } from '../../lib/content/schema/concept'
import { esc } from './util'
import type { Hooks } from './markdown'
import { Outline, Registry, type Model } from './model'

export interface Env {
  bundle: ContentBundle
  model: Model
  reg: Registry
  outline: Outline
  concepts: Map<string, Concept>
  /** anchor id → page number (filled by the second pass; empty on the first). */
  pages: Map<string, number>
  /** Citation superscript linking to the bibliography. */
  cite(sourceId: string): string
}

export function makeEnv(bundle: ContentBundle, model: Model, pages: Map<string, number>): Env {
  const reg = new Registry(new Map(bundle.sources.map((s) => [s.id, s])))
  const env: Env = {
    bundle,
    model,
    reg,
    outline: new Outline(),
    concepts: new Map(bundle.concepts.map((c) => [c.id, c])),
    pages,
    cite: (id) => `<sup class="cite"><a href="#bib-${reg.cite(id)}">[${reg.cite(id)}]</a></sup>`,
  }
  return env
}

interface HeadOpts {
  id?: string
  toc?: boolean
  cls?: string
  match?: string
  /** Visible HTML (defaults to the escaped plain text). */
  html?: string
}

/** Emit a heading and log it in the outline (document order is what maps PDF bookmarks back to page numbers). */
export function heading(env: Env, level: number, text: string, o: HeadOpts = {}): string {
  const id = o.id ?? `h-${env.outline.items.length}`
  env.outline.add({ level, text, id, toc: Boolean(o.toc), match: o.match })
  return `<h${level} id="${id}"${o.cls ? ` class="${o.cls}"` : ''}>${o.html ?? esc(text)}</h${level}>`
}

/** Hooks for strings from YAML: no JSX components, headings are just text. */
export function plainHooks(): Hooks {
  return {
    heading: (_d, text) => `<p><strong>${esc(text)}</strong></p>`,
    component: (_n, _a, _c, inline) => (inline ? '' : ''),
  }
}
