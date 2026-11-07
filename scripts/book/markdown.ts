/** MDX/markdown (mdast) → print HTML. JSX components are delegated to `Hooks`, so this file stays content-agnostic. */
import { createProcessor } from '@mdx-js/mdx'
import katex from 'katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { highlight } from './highlight'
import { esc } from './util'

export interface Node {
  type: string
  value?: string
  lang?: string | null
  depth?: number
  ordered?: boolean
  start?: number | null
  url?: string
  name?: string | null
  align?: (string | null)[]
  attributes?: { type: string; name?: string; value?: unknown }[]
  children?: Node[]
}

export interface Hooks {
  heading(depth: number, text: string): string
  component(name: string, attrs: Record<string, string>, children: Node[], inline: boolean): string
}

const processor = createProcessor({ remarkPlugins: [remarkGfm, remarkMath] })

/** Lesson bodies are MDX (JSX components allowed). */
export function parse(src: string): Node {
  return processor.parse(src) as unknown as Node
}

const mdProcessor = unified().use(remarkParse).use(remarkGfm).use(remarkMath)

/** Strings from YAML are plain markdown: braces and angle brackets are literal text there. */
export function parseMd(src: string): Node {
  return mdProcessor.parse(src) as unknown as Node
}

export function plainText(n: Node): string {
  if (n.type === 'text' || n.type === 'inlineCode' || n.type === 'inlineMath') return n.value ?? ''
  return (n.children ?? []).map(plainText).join('')
}

function attrs(n: Node): Record<string, string> {
  const out: Record<string, string> = {}
  for (const a of n.attributes ?? []) if (a.type === 'mdxJsxAttribute' && a.name && typeof a.value === 'string') out[a.name] = a.value
  return out
}

function math(value: string, display: boolean): string {
  try {
    return katex.renderToString(value, { throwOnError: false, displayMode: display, output: 'html', strict: false })
  } catch {
    return `<code>${esc(value)}</code>`
  }
}

function table(n: Node, h: Hooks): string {
  const rows = n.children ?? []
  const cell = (c: Node, tag: string, i: number) => {
    const a = n.align?.[i]
    return `<${tag}${a ? ` style="text-align:${a}"` : ''}>${inline(c.children ?? [], h)}</${tag}>`
  }
  const head = rows[0] ? `<thead><tr>${(rows[0].children ?? []).map((c, i) => cell(c, 'th', i)).join('')}</tr></thead>` : ''
  const body = rows.slice(1).map((r) => `<tr>${(r.children ?? []).map((c, i) => cell(c, 'td', i)).join('')}</tr>`).join('')
  return `<table class="data">${head}<tbody>${body}</tbody></table>`
}

export function inline(nodes: Node[], h: Hooks): string {
  return nodes.map((n) => inlineNode(n, h)).join('')
}

function inlineNode(n: Node, h: Hooks): string {
  switch (n.type) {
    case 'text': return esc(n.value ?? '')
    case 'emphasis': return `<em>${inline(n.children ?? [], h)}</em>`
    case 'strong': return `<strong>${inline(n.children ?? [], h)}</strong>`
    case 'delete': return `<del>${inline(n.children ?? [], h)}</del>`
    case 'inlineCode': return `<code>${esc(n.value ?? '')}</code>`
    case 'inlineMath': return math(n.value ?? '', false)
    case 'break': return '<br/>'
    case 'link': return `<a href="${esc(n.url ?? '')}">${inline(n.children ?? [], h)}</a>`
    case 'mdxJsxTextElement': return h.component(n.name ?? '', attrs(n), n.children ?? [], true)
    default: return esc(plainText(n))
  }
}

export function blocks(nodes: Node[], h: Hooks): string {
  return nodes.map((n) => blockNode(n, h)).join('\n')
}

function blockNode(n: Node, h: Hooks): string {
  switch (n.type) {
    case 'paragraph': return `<p>${inline(n.children ?? [], h)}</p>`
    case 'heading': return h.heading(n.depth ?? 2, plainText(n))
    case 'list': {
      const tag = n.ordered ? 'ol' : 'ul'
      const start = n.ordered && n.start && n.start !== 1 ? ` start="${n.start}"` : ''
      return `<${tag}${start}>${(n.children ?? []).map((li) => `<li>${blocks(li.children ?? [], h)}</li>`).join('')}</${tag}>`
    }
    case 'blockquote': return `<blockquote>${blocks(n.children ?? [], h)}</blockquote>`
    case 'code': return codeBlock(n.value ?? '', n.lang)
    case 'table': return table(n, h)
    case 'thematicBreak': return '<hr/>'
    case 'math': return `<div class="math-display">${math(n.value ?? '', true)}</div>`
    case 'mdxJsxFlowElement': return h.component(n.name ?? '', attrs(n), n.children ?? [], false)
    case 'mdxFlowExpression': case 'mdxjsEsm': return ''
    default: return `<p>${esc(plainText(n))}</p>`
  }
}

export function codeBlock(code: string, lang?: string | null): string {
  const body = highlight(code.replace(/\n$/, ''), lang)
  return `<pre class="code"><code>${body}</code></pre>`
}

/** Render a markdown string that lives in YAML (quiz prompts, exercise text, …) as blocks. */
export function mdBlocks(src: string, h: Hooks): string {
  try {
    return blocks(parseMd(src).children ?? [], h)
  } catch {
    return `<p>${esc(src)}</p>`
  }
}

/** Render a markdown string as inline HTML (unwraps a single paragraph). */
export function mdInline(src: string, h: Hooks): string {
  try {
    const kids = parseMd(src).children ?? []
    if (kids.length === 1 && kids[0]?.type === 'paragraph') return inline(kids[0].children ?? [], h)
    return blocks(kids, h)
  } catch {
    return esc(src)
  }
}
