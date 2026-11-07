/** Reusable boxes for lesson parts: quiz items, worked examples, applications, labs, simulators, cases, scenarios. */
import type { CaseStudy } from '../../lib/content/schema/case'
import type { Lab } from '../../lib/content/schema/lab'
import type { Scenario, WorkedExample } from '../../lib/content/schema/learning'
import type { QuizItem } from '../../lib/content/schema/quiz'
import type { Simulator } from '../../lib/content/schema/simulator'
import type { Env } from './env'
import { heading, plainHooks } from './env'
import { blocks, codeBlock, mdBlocks, mdInline, parseMd, type Hooks } from './markdown'
import { simulatorFigures } from './sim-figures'
import { QUALITY_VI, VERDICT_VI, esc, fmtDate, fmtNum, optLetter } from './util'

const P = plainHooks()
export const md = (s: string): string => mdInline(s, P)
export const mdb = (s: string): string => mdBlocks(s, P)

function tolerance(t: { kind: 'abs' | 'rel'; value: number }): string {
  return t.kind === 'abs' ? `±${fmtNum(t.value)}` : `±${fmtNum(t.value * 100)}%`
}

/** Deterministic shuffle so ordering questions do not print their own answer. */
function shuffled<T>(items: T[], seedText: string): T[] {
  let seed = 0
  for (const ch of seedText) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0
    const j = seed % (i + 1)
    ;[out[i], out[j]] = [out[j] as T, out[i] as T]
  }
  return out
}

export function quizBox(item: QuizItem, label: string): { html: string; answer: string } {
  let body = ''
  let ans = ''
  if (item.type === 'mcq') {
    const multi = item.correct.length > 1
    body = `<ol class="opts">${item.options.map((o) => `<li data-l="${optLetter(o.id)}">${md(o.text)}</li>`).join('')}</ol>${multi ? '<p class="hint">Có thể có nhiều hơn một đáp án đúng.</p>' : ''}`
    ans = `<p><strong>Đáp án: ${item.correct.map(optLetter).join(', ')}.</strong> ${md(item.explanation)}</p>`
  } else if (item.type === 'numeric') {
    body = `<p class="blank">Đáp số: ………………… ${item.unit ? esc(item.unit) : ''}</p>`
    ans = `<p><strong>Đáp số: ${fmtNum(item.answer)}${item.unit ? ` ${esc(item.unit)}` : ''}</strong> (chấp nhận sai lệch ${tolerance(item.tolerance)}). ${md(item.explanation)}</p>`
  } else if (item.type === 'ordering') {
    body = `<p class="hint">Sắp xếp các mục sau theo đúng thứ tự (đánh số 1, 2, 3…):</p><ul class="order">${shuffled(item.items, item.id).map((o) => `<li>☐ ${md(o.text)}</li>`).join('')}</ul>`
    ans = `<p><strong>Thứ tự đúng:</strong> ${item.items.map((o, i) => `${i + 1}) ${md(o.text)}`).join('; ')}. ${md(item.explanation)}</p>`
  } else {
    body = '<p class="blank">Trả lời bằng lời của bạn rồi đối chiếu với đáp án mẫu ở phụ lục.</p>'
    ans = `<p>${md(item.modelAnswer)}</p><ul class="check">${item.rubric.map((r) => `<li>${md(r.criterion)}</li>`).join('')}</ul><p>${md(item.explanation)}</p>`
  }
  const html = `<div class="quiz"><div class="box-h"><span>Câu ${label}</span><em>đáp án: Phụ lục A</em></div><div class="q-prompt">${mdb(item.prompt)}</div>${body}</div>`
  return { html, answer: `<div class="ans"><span class="ans-n">Câu ${label}</span>${ans}</div>` }
}

export function exampleBox(env: Env, ex: WorkedExample, chapterNo: number): string {
  const n = env.reg.figureNo(chapterNo)
  const steps = ex.steps
    .map((s) => {
      const faded = s.faded && s.prompt
        ? `<div class="self-calc">✎ <strong>Tự tính trước khi đọc tiếp:</strong> ${md(s.prompt)} <span class="self-ans">Đáp số: ${s.answer !== undefined ? fmtNum(s.answer) : '…'}${s.unit ? ` ${esc(s.unit)}` : ''}${s.tolerance && s.answer !== undefined ? ` (sai lệch cho phép ${tolerance(s.tolerance)})` : ''}</span></div>`
        : ''
      return `<li><div>${md(s.text)}</div>${faded}</li>`
    })
    .join('')
  return `<div class="example"><div class="box-h"><span>Ví dụ giải từng bước ${n} — ${esc(ex.title)}</span></div><div class="ex-problem">${mdb(ex.problem)}</div><ol class="steps">${steps}</ol><p class="takeaway"><strong>Rút ra:</strong> ${md(ex.takeaway)}</p></div>`
}

export function applicationBox(a: { title: string; context: string; task: string; deliverable: string }): string {
  return `<div class="application"><div class="box-h"><span>Dự án thực hành — ${esc(a.title)}</span></div><dl><dt>Bối cảnh</dt><dd>${md(a.context)}</dd><dt>Nhiệm vụ</dt><dd>${md(a.task)}</dd><dt>Sản phẩm bàn giao</dt><dd>${md(a.deliverable)}</dd></dl></div>`
}

export function labBox(env: Env, lab: Lab, h: Hooks): string {
  const n = env.reg.labNo(lab.id)
  const instructions = blocks(parseMd(lab.instructions).children ?? [], h)
  return `<div class="lab"><div class="box-h"><span>Thực hành lập trình C.${n} — ${esc(lab.title.vi)}</span><em>lời giải và bộ kiểm thử: Phụ lục C.${n}</em></div><p>${md(lab.summary)}</p><div class="lab-ins">${instructions}</div><p class="cap">Mã khởi đầu (Python 3, chỉ dùng thư viện chuẩn):</p>${codeBlock(lab.starter, 'python')}</div>`
}

export function simulatorBox(env: Env, sim: Simulator, lessonNo: string, chapterNo: number, syntheticLabel: string): string {
  const seen = env.reg.simSeen.get(sim.id)
  if (seen) return `<div class="sim-ref"><strong>Mô phỏng: ${esc(sim.title.vi)}.</strong> Đã trình bày ở bài ${seen}; bản tương tác có trên website.</div>`
  env.reg.simSeen.set(sim.id, lessonNo)
  const figs = simulatorFigures(sim)
    .map((f) => {
      const n = env.reg.figureNo(chapterNo)
      const isHtml = f.svg.startsWith('<p') || f.svg.startsWith('<table')
      return `<figure class="figure">${isHtml ? f.svg : f.svg}<figcaption><strong>Hình ${n}.</strong> ${esc(f.caption)}${sim.dataKind === 'formula' ? '' : ` <em>${esc(syntheticLabel)}.</em>`}</figcaption></figure>`
    })
    .join('')
  const params = sim.params.map((p) => `<tr><td>${esc(p.label)}</td><td>${fmtNum(p.min)} – ${fmtNum(p.max)}</td><td>${fmtNum(p.default)}${p.unit ? ` ${esc(p.unit)}` : ''}</td></tr>`).join('')
  const breaks = sim.breakIt.map((b) => `<li><strong>${esc(b.label)}.</strong> ${md(b.explanation)}</li>`).join('')
  return `<div class="sim"><div class="box-h"><span>Mô phỏng — ${esc(sim.title.vi)}</span><em>bản tương tác: website</em></div><p>${md(sim.summary)}</p>${sim.dataKind === 'formula' ? '' : `<p class="synthetic">${esc(syntheticLabel)}${sim.syntheticNote ? `. ${md(sim.syntheticNote)}` : ''}</p>`}${figs}<table class="data"><thead><tr><th>Tham số</th><th>Khoảng điều chỉnh</th><th>Giá trị mặc định</th></tr></thead><tbody>${params}</tbody></table><div class="how">${mdb(sim.howToRead)}</div><p class="cap"><strong>Thử phá nó:</strong></p><ul>${breaks}</ul></div>`
}

export function caseRef(env: Env, c: CaseStudy): string {
  const n = env.reg.caseNo(c.id)
  return `<div class="ref-box"><strong>Ca nghiên cứu D.${n}: ${esc(c.title.vi)}</strong> (${esc(c.period)}). ${md(c.summary)} <em>Toàn văn: Phụ lục D.${n}.</em></div>`
}

export function scenarioRef(env: Env, s: Scenario): string {
  const n = env.reg.scenarioNo(s.id)
  return `<div class="ref-box"><strong>Tình huống nhập vai E.${n}: ${esc(s.title.vi)}.</strong> ${md(s.summary)} <em>Chơi theo hướng dẫn ở Phụ lục E.${n}.</em></div>`
}

export function caseFull(env: Env, c: CaseStudy, no: number): string {
  const tl = c.timeline.map((e) => `<tr><td>${esc(e.date)}</td><td>${md(e.event)}${e.status === 'verified' ? '' : ' <em>(chưa kiểm chứng đầy đủ)</em>'}${e.sourceIds.map(env.cite).join('')}</td></tr>`).join('')
  const causes = c.rootCauses.map((r) => `<li>${md(r.text)}${r.sourceIds.map(env.cite).join('')}</li>`).join('')
  const qs = c.questions.map((q, i) => `<li><strong>Câu hỏi ${i + 1}.</strong> ${md(q.prompt)}<ul class="check">${q.rubric.map((r) => `<li>${md(r.criterion)}</li>`).join('')}</ul></li>`).join('')
  const ctl = c.controls.map((k) => `<tr><td>${md(k.control)}</td><td>${md(k.devAnalogy)}</td></tr>`).join('')
  return `${heading(env, 3, `D.${no} ${c.title.vi}`, { toc: true, id: `case-${c.id}`, cls: 'app-h3' })}<p class="meta">${esc(c.title.en)} · ${esc(c.period)} · kiểm tra ngày ${fmtDate(c.lastVerified)}</p><p>${md(c.summary)}</p><table class="data"><thead><tr><th style="width:24%">Thời điểm</th><th>Sự kiện</th></tr></thead><tbody>${tl}</tbody></table>${heading(env, 4, 'Nguyên nhân gốc', { cls: 'sub' })}<ul>${causes}</ul>${heading(env, 4, 'Câu hỏi thảo luận', { cls: 'sub' })}<ol class="plain">${qs}</ol>${heading(env, 4, 'Biện pháp kiểm soát và ví dụ tương đương trong lập trình', { cls: 'sub' })}<table class="data"><thead><tr><th>Biện pháp kiểm soát</th><th>Tương đương trong lập trình</th></tr></thead><tbody>${ctl}</tbody></table>`
}

export function scenarioFull(env: Env, s: Scenario, no: number): string {
  const order = s.nodes.map((n) => n.id)
  const label = (id: string): string => `${order.indexOf(id) + 1}`
  const nodes = s.nodes
    .map((n, i) => {
      const body = n.choices
        ? `<ul class="choices">${n.choices.map((c) => `<li><strong>${String.fromCharCode(65 + n.choices!.indexOf(c))}.</strong> ${md(c.label)} <span class="goto">→ đọc đoạn ${label(c.next)}</span><div class="fb">(${QUALITY_VI[c.quality]}) ${md(c.feedback)}</div></li>`).join('')}</ul>`
        : `<p class="ending"><strong>Kết thúc — ${VERDICT_VI[n.ending!.verdict]}.</strong> ${md(n.ending!.debrief)}</p>`
      return `<div class="node"><div class="node-n">Đoạn ${i + 1}${n.id === s.start ? ' (bắt đầu)' : ''}</div><p>${md(n.text)}</p>${body}</div>`
    })
    .join('')
  return `${heading(env, 3, `E.${no} ${s.title.vi}`, { toc: true, id: `scn-${s.id}`, cls: 'app-h3' })}<p class="meta">${esc(s.title.en)}</p><p><strong>Vai của bạn:</strong> ${md(s.role)}</p><p>${md(s.summary)}</p><p class="synthetic">${md(s.hypotheticalNote)}</p><p class="hint">Cách chơi: đọc đoạn 1, chọn một hướng xử lý, rồi đọc đoạn được chỉ dẫn. Đọc phản hồi sau mỗi lựa chọn trước khi tiếp tục.</p>${nodes}${s.sourceIds.length ? `<p class="meta">Nguồn: ${s.sourceIds.map(env.cite).join(' ')}</p>` : ''}`
}
