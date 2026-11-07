/** One lesson → print HTML: header, body (with components expanded), review material, references. */
import { applicationBox, caseRef, exampleBox, labBox, md, mdb, quizBox, scenarioRef, simulatorBox } from './boxes'
import { heading, type Env } from './env'
import { blocks, inline, parse, type Hooks, type Node } from './markdown'
import type { LessonEntry } from './model'
import { diagramSvg } from './svg-diagram'
import { esc, fmtDate } from './util'

const STATUS_VI: Record<string, string> = { verified: 'đã kiểm chứng', draft: 'bản nháp', needs_verification: 'cần kiểm chứng thêm' }

function quizRefs(n: Node, out: string[] = []): string[] {
  if ((n.type === 'mdxJsxFlowElement' || n.type === 'mdxJsxTextElement') && n.name === 'Quiz') {
    const id = n.attributes?.find((a) => a.name === 'id')?.value
    if (typeof id === 'string') out.push(id)
  }
  for (const c of n.children ?? []) quizRefs(c, out)
  return out
}

export function lessonHtml(env: Env, entry: LessonEntry): string {
  const { lesson, no, chapterNo } = entry
  const cfg = env.bundle.config.site
  const titleH = heading(env, 3, `${no} ${lesson.title.vi}`, { toc: true, id: `h-${lesson.id}`, cls: 'lesson-title', html: `<span class="no">${no}</span> ${esc(lesson.title.vi)}` })
  const tree = parse(lesson.body)
  const quizById = new Map(lesson.quiz.map((q) => [q.id, q]))
  const inBody = quizRefs(tree).filter((id, i, a) => a.indexOf(id) === i && quizById.has(id))
  const extras = lesson.quiz.map((q) => q.id).filter((id) => !inBody.includes(id))
  const labels = new Map([...inBody, ...extras].map((id, i) => [id, `${no}.${i + 1}`]))
  const printed = new Set<string>()

  const printQuiz = (id: string): string => {
    const item = quizById.get(id)
    if (!item || printed.has(id)) return ''
    printed.add(id)
    const { html, answer } = quizBox(item, labels.get(id) as string)
    env.reg.push(env.reg.answers, lesson.id, answer)
    return html
  }

  const hooks: Hooks = {
    heading: (depth, text) => heading(env, depth + 2, text, { cls: 'sub' }),
    component: (name, a, children, isInline) => {
      switch (name) {
        case 'Callout': {
          const kind = a.kind ?? 'note'
          const conf = cfg.callouts[kind]
          const title = a.title ? `: ${esc(a.title)}` : ''
          const disc = conf?.disclaimer ? `<p class="disc">${esc(conf.disclaimer)}</p>` : ''
          return `<div class="callout callout-${esc(kind)}"><div class="box-h"><span>${esc(conf?.label ?? kind)}${title}</span></div>${disc}${blocks(children, hooks)}</div>`
        }
        case 'Sidenote': return `<aside class="sidenote">${blocks(children, hooks)}</aside>`
        case 'Term': return `<span class="term">${inline(children, hooks)}</span>`
        case 'Fact': {
          const f = lesson.facts.find((x) => x.id === a.id)
          if (!f) return ''
          const v = f.status === 'verified' && f.value ? `<strong>${esc(f.value)}</strong>` : '<em>[chưa kiểm chứng — không nêu số]</em>'
          return `<span class="fact">${esc(f.text)} ${v}${env.cite(f.sourceId)}</span>`
        }
        case 'Quiz': return printQuiz(a.id ?? '')
        case 'WorkedExample': {
          const ex = lesson.examples.find((x) => x.id === a.id)
          return ex ? exampleBox(env, ex, chapterNo) : ''
        }
        case 'Diagram': {
          const d = lesson.diagrams.find((x) => x.id === a.id)
          if (!d) return ''
          const n = env.reg.figureNo(chapterNo)
          return `<figure class="figure">${diagramSvg(d)}<figcaption><strong>Hình ${n}.</strong> ${md(d.title)}. ${md(d.caption)}</figcaption></figure>`
        }
        case 'Simulator': {
          const s = env.bundle.simulators.find((x) => x.id === a.id)
          return s ? simulatorBox(env, s, no, chapterNo, cfg.syntheticLabel) : ''
        }
        case 'Lab': {
          const l = env.bundle.labs.find((x) => x.id === a.id)
          return l ? labBox(env, l, hooks) : ''
        }
        case 'Case': {
          const c = env.bundle.cases.find((x) => x.id === a.id)
          return c ? caseRef(env, c) : ''
        }
        case 'Scenario': {
          const s = env.bundle.scenarios.find((x) => x.id === a.id)
          return s ? scenarioRef(env, s) : ''
        }
        case 'Figure': return `<figure class="figure">${blocks(children, hooks)}${a.caption ? `<figcaption>${esc(a.caption)}</figcaption>` : ''}</figure>`
        default: return isInline ? inline(children, hooks) : blocks(children, hooks)
      }
    },
  }

  const body = blocks(tree.children ?? [], hooks)
  const conceptNames = lesson.concepts.map((id) => env.concepts.get(id)?.name.vi ?? id)
  const pre = lesson.pretest.map((id) => labels.get(id)).filter(Boolean)
  const pretest = `<div class="pretest"><div class="box-h"><span>Khởi động: đoán trước khi đọc</span></div><p>Trước khi đọc tiếp, hãy thử trả lời ${pre.length > 1 ? 'các câu' : 'câu'} <strong>${pre.join(', ')}</strong> trong bài (không cần đúng — cuốn sách này không chấm điểm). Đoán trước giúp bạn đọc có chủ đích; sau khi đọc, hãy quay lại so sánh.</p></div>`

  const dev = `<div class="devmap"><div class="box-h"><span>Đối chiếu với góc nhìn lập trình viên</span></div><table class="data"><thead><tr><th style="width:24%">Khái niệm</th><th style="width:30%">Tương đương trong lập trình</th><th>Giải thích</th></tr></thead><tbody>${lesson.devMapping.map((m) => `<tr><td>${md(m.finance)}</td><td>${md(m.dev)}</td><td>${md(m.explanation)}</td></tr>`).join('')}</tbody></table></div>`
  const self = `<div class="selfx"><div class="box-h"><span>Tự giải thích</span></div>${mdb(lesson.selfExplain.prompt)}<p class="hint">Tự đối chiếu câu trả lời của bạn với các tiêu chí sau:</p><ul class="check">${lesson.selfExplain.rubric.map((r) => `<li>${md(r.criterion)}</li>`).join('')}</ul></div>`
  const extraQuiz = extras.length ? `${heading(env, 5, 'Câu hỏi bổ sung', { cls: 'sub' })}${extras.map(printQuiz).join('')}` : ''

  const exercises = lesson.exercises
    .map((e, i) => {
      const lab = `${no}.${i + 1}`
      env.reg.push(env.reg.solutions, lesson.id, `<div class="ans"><span class="ans-n">Bài tập ${lab}</span><p class="was">${md(e.prompt)}</p>${mdb(e.solution)}</div>`)
      return `<div class="exercise"><div class="box-h"><span>Bài tập ${lab}</span><em>lời giải: Phụ lục B</em></div>${mdb(e.prompt)}${e.hint ? `<p class="hint"><strong>Gợi ý:</strong> ${md(e.hint)}</p>` : ''}</div>`
    })
    .join('')

  const srcIds = [...new Set([...lesson.sources, ...lesson.facts.map((f) => f.sourceId)])]
  const refs = srcIds
    .map((id) => {
      const s = env.reg.sources.get(id)
      return s ? `<li>${env.cite(id)} ${esc(s.title)} — <em>${esc(s.publisher)}</em></li>` : ''
    })
    .join('')

  return `<section class="lesson" id="${entry.anchor}">
${titleH}
<p class="en-title">${esc(lesson.title.en)}</p>
<p class="meta">Thời lượng ước tính: ${lesson.estMinutes} phút · Nguồn kiểm tra ngày ${fmtDate(lesson.lastVerified)} · Trạng thái: ${STATUS_VI[lesson.status]}</p>
<div class="lead"><span class="lead-k">Câu hỏi dẫn dắt</span>${md(lesson.whyQuestion)}</div>
<div class="abstract"><p><strong>Nội dung chính.</strong> ${md(lesson.summary)}</p><p class="concepts"><strong>Khái niệm trong bài:</strong> ${conceptNames.map(esc).join('; ')}.</p></div>
${pretest}
<div class="body">${body}</div>
${dev}
${self}
${extraQuiz}
${heading(env, 4, 'Bài tập', { cls: 'sub' })}${exercises}
${heading(env, 4, 'Áp dụng vào công việc', { cls: 'sub' })}${lesson.applications.map(applicationBox).join('')}
<div class="refs"><div class="box-h"><span>Nguồn của bài</span></div><ul>${refs}</ul></div>
</section>`
}
