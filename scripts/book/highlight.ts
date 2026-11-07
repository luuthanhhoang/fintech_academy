/** Tiny dependency-free syntax highlighter for the printed listings (comments, strings, numbers, keywords). */
import { esc } from './util'

const PY = 'def class return if elif else for while in not and or is None True False import from as with try except raise finally lambda pass break continue yield assert global del async await'
const JS = 'const let var function return if else for while of in new class extends import from export default async await try catch finally throw typeof instanceof null undefined true false type interface enum implements readonly switch case break continue this void'
const SQL = 'select from where join left right inner outer on group by order having insert into values update set delete create table index unique primary key foreign references not null and or as limit offset alter add column constraint check default begin commit rollback'
const SH = 'if then else fi for do done while case esac function export echo cd npm npx git docker kubectl'

interface Lang {
  comment: RegExp
  keywords: Set<string>
}

const kw = (s: string): Set<string> => new Set(s.split(' '))
const HASH = /#[^\n]*/
const SLASH = /\/\/[^\n]*|\/\*[\s\S]*?\*\//

const LANGS: Record<string, Lang> = {
  python: { comment: HASH, keywords: kw(PY) },
  py: { comment: HASH, keywords: kw(PY) },
  js: { comment: SLASH, keywords: kw(JS) },
  javascript: { comment: SLASH, keywords: kw(JS) },
  ts: { comment: SLASH, keywords: kw(JS) },
  typescript: { comment: SLASH, keywords: kw(JS) },
  css: { comment: /\/\*[\s\S]*?\*\//, keywords: kw('') },
  json: { comment: /(?!)/, keywords: kw('true false null') },
  yaml: { comment: HASH, keywords: kw('true false null') },
  dockerfile: { comment: HASH, keywords: kw('FROM RUN COPY CMD USER WORKDIR ENV AS EXPOSE ENTRYPOINT ARG') },
  sql: { comment: /--[^\n]*/, keywords: kw(SQL) },
  bash: { comment: HASH, keywords: kw(SH) },
  sh: { comment: HASH, keywords: kw(SH) },
}

const STRING = /"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`[^`]*`/

/** Returns escaped HTML with <span class="tok-…"> wrappers. Unknown languages are only escaped. */
export function highlight(code: string, lang: string | null | undefined): string {
  const spec = lang ? LANGS[lang.toLowerCase()] : undefined
  if (!spec) return esc(code)
  const re = new RegExp(`(${spec.comment.source})|(${STRING.source})|(\\b\\d+(?:\\.\\d+)?\\b)|([A-Za-z_][A-Za-z0-9_]*)`, 'g')
  let out = ''
  let last = 0
  for (const m of code.matchAll(re)) {
    out += esc(code.slice(last, m.index))
    last = (m.index ?? 0) + m[0].length
    if (m[1] !== undefined) out += `<span class="tok-c">${esc(m[1])}</span>`
    else if (m[2] !== undefined) out += `<span class="tok-s">${esc(m[2])}</span>`
    else if (m[3] !== undefined) out += `<span class="tok-n">${esc(m[3])}</span>`
    else if (m[4] !== undefined && spec.keywords.has(m[4])) out += `<span class="tok-k">${esc(m[4])}</span>`
    else out += esc(m[0])
  }
  return out + esc(code.slice(last))
}
