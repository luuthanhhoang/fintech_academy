/** Back matter: answers, solutions, lab reference code, cases, scenarios, glossary, bibliography. */
import { caseFull, md, scenarioFull } from './boxes'
import { heading, type Env } from './env'
import { codeBlock } from './markdown'
import { esc, fmtDate, slug } from './util'

const APPENDIX = (env: Env, letter: string, title: string, intro: string): string =>
  `<section class="appendix">${heading(env, 1, `Phụ lục ${letter}. ${title}`, { toc: true, id: `app-${letter}`, html: `<span class="app-no">Phụ lục ${letter}</span>${esc(title)}` })}<p class="intro">${intro}</p>`

function byLesson(env: Env, map: Map<string, string[]>, cls: string): string {
  return env.model.chapters
    .map((ch) => {
      const rows = ch.lessons
        .filter((l) => map.has(l.lesson.id))
        .map((l) => `<div class="${cls}">${heading(env, 4, `${l.no} ${l.lesson.title.vi}`, { cls: 'app-lesson' })}${(map.get(l.lesson.id) as string[]).join('')}</div>`)
        .join('')
      return rows ? `<div class="app-chapter">Chương ${ch.chapterNo}. ${esc(ch.stage.title.vi)}</div>${rows}` : ''
    })
    .join('')
}

export function answersAppendix(env: Env): string {
  return `${APPENDIX(env, 'A', 'Đáp án câu hỏi tự kiểm tra', 'Chỉ xem đáp án sau khi đã tự trả lời. Với câu tự luận, đối chiếu câu trả lời của bạn với đáp án mẫu và các tiêu chí kèm theo.')}${byLesson(env, env.reg.answers, 'app-block')}</section>`
}

export function solutionsAppendix(env: Env): string {
  return `${APPENDIX(env, 'B', 'Lời giải bài tập', 'Lời giải chỉ là một cách làm hợp lệ; nếu bạn ra cùng đáp số bằng cách khác thì vẫn đúng. Đề bài được nhắc lại ngắn để bạn không phải lật trang.')}${byLesson(env, env.reg.solutions, 'app-block')}</section>`
}

export function labsAppendix(env: Env): string {
  const ids = env.reg.labs()
  const rest = env.bundle.labs.map((l) => l.id).filter((id) => !ids.includes(id))
  const all = [...ids, ...rest]
  const head = APPENDIX(env, 'C', 'Bài thực hành lập trình: lời giải mẫu và bộ kiểm thử', 'Các bài thực hành chạy trực tiếp trong trình duyệt trên website (Python, chỉ dùng thư viện chuẩn). Trong sách này bạn có thể chạy cùng mã bằng Python 3: nạp mã của bạn, nạp tiếp bộ kiểm thử rồi gọi lần lượt các hàm <code>test_*</code>.')
  const items = all
    .map((id, i) => {
      const lab = env.bundle.labs.find((l) => l.id === id)
      if (!lab) return ''
      return `<div class="app-block">${heading(env, 3, `C.${i + 1} ${lab.title.vi}`, { toc: true, id: `lab-${lab.id}`, cls: 'app-h3' })}<p class="meta">Khái niệm: ${lab.concepts.map((c) => esc(env.concepts.get(c)?.name.vi ?? c)).join('; ')}</p><p class="cap">Lời giải mẫu (solution.py):</p>${codeBlock(lab.solution, 'python')}<p class="cap">Bộ kiểm thử (tests.py) — chạy sau khi nạp mã của bạn; mỗi hàm <code>test_*</code> là một phép kiểm tra:</p>${codeBlock(lab.tests, 'python')}</div>`
    })
    .join('')
  return `${head}${items}</section>`
}

export function casesAppendix(env: Env): string {
  const ids = env.reg.cases()
  const all = [...ids, ...env.bundle.cases.map((c) => c.id).filter((id) => !ids.includes(id))]
  const head = APPENDIX(env, 'D', 'Ca nghiên cứu', 'Các sự cố có thật, dữ kiện đều có nguồn và mức độ kiểm chứng ghi kèm. Đọc như hồ sơ điều tra: ai quyết định gì, dựa trên thông tin nào, và kiểm soát nào đã thiếu.')
  const items = all.map((id, i) => {
    const c = env.bundle.cases.find((x) => x.id === id)
    return c ? `<div class="app-block case">${caseFull(env, c, i + 1)}</div>` : ''
  })
  return `${head}${items.join('')}</section>`
}

export function scenariosAppendix(env: Env): string {
  const ids = env.reg.scenarios()
  const all = [...ids, ...env.bundle.scenarios.map((s) => s.id).filter((id) => !ids.includes(id))]
  const head = APPENDIX(env, 'E', 'Tình huống nhập vai', 'Tình huống giả định để luyện phán đoán — không mô tả sự kiện có thật. Cách chơi: đọc đoạn 1, chọn một hướng xử lý, rồi nhảy tới đoạn được chỉ dẫn.')
  const items = all.map((id, i) => {
    const s = env.bundle.scenarios.find((x) => x.id === id)
    return s ? `<div class="app-block scenario">${scenarioFull(env, s, i + 1)}</div>` : ''
  })
  return `${head}${items.join('')}</section>`
}

export function glossaryAppendix(env: Env): string {
  const where = new Map<string, string[]>()
  for (const l of env.model.lessons) for (const c of l.lesson.concepts) where.set(c, [...(where.get(c) ?? []), l.no])
  const sorted = [...env.bundle.concepts].sort((a, b) => a.name.vi.localeCompare(b.name.vi, 'vi'))
  let letter = ''
  const rows = sorted
    .map((c) => {
      const first = slug(c.name.vi).charAt(0).toUpperCase()
      const head = first !== letter ? `<div class="letter">${(letter = first)}</div>` : ''
      const pre = c.prerequisites.map((p) => esc(env.concepts.get(p)?.name.vi ?? p)).join('; ')
      return `${head}<div class="gl"><strong>${esc(c.name.vi)}</strong> <span class="en">(${esc(c.name.en)})</span>. ${md(c.short)}${pre ? ` <span class="pre">Nên biết trước: ${pre}.</span>` : ''} <span class="where">Bài: ${(where.get(c.id) ?? []).join(', ') || '—'}.</span></div>`
    })
    .join('')
  return `${APPENDIX(env, 'F', 'Bảng thuật ngữ và khái niệm', `Toàn bộ ${sorted.length} khái niệm của ba lộ trình, xếp theo thứ tự chữ cái; cuối mỗi mục là các bài dạy khái niệm đó.`)}<div class="glossary">${rows}</div></section>`
}

export function bibliographyAppendix(env: Env): string {
  const rows = env.reg
    .citedIds()
    .map((id, i) => {
      const s = env.reg.sources.get(id)
      if (!s) return ''
      return `<div class="bib" id="bib-${i + 1}"><span class="bn">[${i + 1}]</span><div>${esc(s.publisher)}. <em>${esc(s.title)}</em>. <span class="url">${esc(s.url)}</span> — truy cập ngày ${fmtDate(s.accessed)}.${s.note ? ` <span class="bnote">Ghi chú: ${esc(s.note)}</span>` : ''}</div></div>`
    })
    .join('')
  return `${APPENDIX(env, 'G', 'Tài liệu tham khảo', 'Mỗi số liệu thật trong sách gắn với một nguồn và ngày kiểm tra. Cột ghi chú nêu trung thực mức đã kiểm chứng: nguồn nào chỉ đối chiếu qua trích đoạn, nguồn nào có thông tin có thể đã thay đổi — với những chỗ đó sách không nêu con số cụ thể.')}${rows}</section>`
}
