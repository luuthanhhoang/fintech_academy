/**
 * Build the printed book: content/ → HTML → PDF (Chromium). Two passes: the first renders without page numbers and
 * reads the PDF bookmarks; the second fills the table of contents with real page numbers.
 * Usage: npx tsx scripts/book/build.ts [--html-only]
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { loadContent } from '../../lib/content/load'
import { answersAppendix, bibliographyAppendix, casesAppendix, glossaryAppendix, labsAppendix, scenariosAppendix, solutionsAppendix } from './appendix'
import { makeEnv, type Env } from './env'
import { BOOK, chapterOpener, copyrightPage, cover, methods, partOpener, preface, readingGuide, titlePage, tocBody, tocShell } from './front'
import { lessonHtml } from './lesson-html'
import { buildModel } from './model'
import { css } from './styles'

/** Playwright is not a project dependency (only needed to print the book); resolve it like a global tool. */
interface Browser { newPage(): Promise<Page>; close(): Promise<void> }
interface Page {
  setDefaultTimeout(ms: number): void
  goto(url: string, o: { waitUntil: string }): Promise<unknown>
  evaluate(fn: () => unknown): Promise<unknown>
  pdf(o: Record<string, unknown>): Promise<unknown>
}
function loadChromium(): { launch(): Promise<Browser> } {
  try {
    return (createRequire(import.meta.url)('playwright') as { chromium: { launch(): Promise<Browser> } }).chromium
  } catch {
    throw new Error('Cần Playwright + Chromium (npm i -g playwright) để in PDF; hoặc dùng --html-only rồi in HTML bằng trình duyệt.')
  }
}

const ROOT = process.cwd()
const OUT = join(ROOT, 'book')
const PDF = join(OUT, 'FinAI-Academy-So-tay.pdf')
const HTML = join(OUT, 'book.html')

const norm = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '')

function compose(pages: Map<string, number>): { html: string; env: Env } {
  const bundle = loadContent(ROOT)
  const model = buildModel(bundle)
  const env = makeEnv(bundle, model, pages)
  const out: string[] = [cover(env), titlePage(env), copyrightPage(env), preface(env), readingGuide(env), methods(env), tocShell(env)]
  for (const part of model.parts) {
    out.push(partOpener(env, part))
    for (const ch of part.chapters) {
      out.push(`<div class="chapter" style="page:${ch.pageName};--c:${part.track.color}">${chapterOpener(env, ch)}${ch.lessons.map((l) => lessonHtml(env, l)).join('\n')}</div>`)
    }
  }
  out.push(answersAppendix(env), solutionsAppendix(env), labsAppendix(env), casesAppendix(env), scenariosAppendix(env), glossaryAppendix(env), bibliographyAppendix(env))
  const katexDir = resolve(ROOT, 'node_modules/katex/dist')
  const katexCss = readFileSync(join(katexDir, 'katex.min.css'), 'utf8').replace(/url\(fonts\//g, `url(${pathToFileURL(join(katexDir, 'fonts')).href}/`)
  const body = out.join('\n').replace('%%TOC%%', tocBody(env))
  const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${BOOK.title} — ${BOOK.subtitle}</title><style>${css(model, katexCss, `${BOOK.title} — ${BOOK.subtitle}`)}</style></head><body>${body}</body></html>`
  return { html, env }
}

async function renderPdf(html: string): Promise<void> {
  mkdirSync(OUT, { recursive: true })
  writeFileSync(HTML, html)
  const browser = await loadChromium().launch()
  try {
    const page = await browser.newPage()
    page.setDefaultTimeout(0)
    await page.goto(pathToFileURL(HTML).href, { waitUntil: 'load' })
    await page.evaluate(() => document.fonts.ready)
    await page.pdf({ path: PDF, preferCSSPageSize: true, printBackground: true, outline: true, tagged: true })
  } finally {
    await browser.close()
  }
}

function readPages(env: Env): Map<string, number> {
  const raw = execFileSync('python3', ['-I', join(ROOT, 'scripts/book/outline.py'), PDF], { maxBuffer: 1 << 26 }).toString()
  const marks = JSON.parse(raw) as { title: string; page: number }[]
  const pages = new Map<string, number>()
  let j = 0
  const missing: string[] = []
  for (const item of env.outline.items) {
    const key = norm(item.match ?? item.text)
    let k = j
    while (k < Math.min(marks.length, j + 12) && !norm((marks[k] as { title: string }).title).startsWith(key)) k++
    if (k < Math.min(marks.length, j + 12)) {
      pages.set(item.id, (marks[k] as { page: number }).page)
      j = k + 1
    } else if (item.toc) {
      missing.push(item.text)
      if (process.env.BOOK_DEBUG && missing.length < 3) console.warn(`  ✗ "${item.text}" key=${key} j=${j} marks[j]=${JSON.stringify((marks[j] as { title: string } | undefined)?.title)}`)
    }
  }
  if (missing.length) console.warn(`⚠ không tìm thấy trang cho ${missing.length} mục: ${missing.slice(0, 5).join(' | ')}`)
  return pages
}

async function main(): Promise<void> {
  const first = compose(new Map())
  if (process.argv.includes('--html-only')) {
    mkdirSync(OUT, { recursive: true })
    writeFileSync(HTML, first.html)
    console.log(`HTML: ${HTML} (${Math.round(first.html.length / 1024)} KB), ${first.env.outline.items.length} tiêu đề`)
    return
  }
  console.log('Lượt 1: dựng PDF để đo số trang…')
  await renderPdf(first.html)
  const pages = readPages(first.env)
  console.log(`Lượt 2: điền mục lục (${pages.size} mục có số trang)…`)
  const second = compose(pages)
  await renderPdf(second.html)
  const pdfPages = execFileSync('pdfinfo', [PDF]).toString().match(/Pages:\s+(\d+)/)?.[1]
  console.log(`✓ ${PDF} — ${pdfPages} trang, ${(statSync(PDF).size / 1048576).toFixed(1)} MB`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
