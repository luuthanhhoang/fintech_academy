/** Front matter and the structural pages: cover, title, preface, reading guide, methods, TOC, part/chapter openers. */
import { md, mdb } from './boxes'
import { heading, type Env } from './env'
import { roman, type ChapterEntry, type PartEntry } from './model'
import { esc, fmtDate } from './util'

export const BOOK = {
  title: 'FinAI Academy',
  subtitle: 'Sổ tay Fintech, AI/LLM và Fullstack',
  tagline: 'Từ khái niệm đến hệ thống chạy thật — dành cho người làm kỹ thuật',
  edition: 'Ấn bản in từ nội dung website, tháng 11 năm 2026',
}

export function cover(env: Env): string {
  const rails = env.model.parts.map((p) => `<i style="background:${p.track.color}"></i>`).join('')
  const parts = env.model.parts.map((p) => `<li><span style="color:${p.track.color}">●</span> ${esc(p.track.title.vi)}</li>`).join('')
  return `<section class="cover"><div class="rails">${rails}</div><div class="cover-body"><p class="cover-kicker">GIÁO TRÌNH TỰ HỌC</p><p class="cover-title">${BOOK.title}</p><p class="cover-sub">${BOOK.subtitle}</p><p class="cover-tag">${BOOK.tagline}</p><ul class="cover-parts">${parts}</ul></div><p class="cover-ed">${BOOK.edition}</p></section>`
}

export function titlePage(env: Env): string {
  const b = env.bundle
  return `<section class="titlepage"><p class="tp-title">${BOOK.title}</p><p class="tp-sub">${BOOK.subtitle}</p><div class="tp-rule"></div><p class="tp-line">${b.lessons.length} bài học · ${b.concepts.length} khái niệm · ${b.labs.length} bài thực hành lập trình · ${b.cases.length} ca nghiên cứu · ${b.scenarios.length} tình huống nhập vai</p><p class="tp-ed">${BOOK.edition}</p></section>`
}

export function copyrightPage(env: Env): string {
  const site = env.bundle.config.site
  return `<section class="copyright"><p><strong>${esc(site.disclaimer)}</strong></p><p>Cuốn sách này được dựng tự động từ toàn bộ nội dung của website ${esc(site.name)} (cùng một nguồn dữ liệu: bài học, câu hỏi, bài tập, sơ đồ, bài thực hành, ca nghiên cứu, nguồn tham khảo), nên mọi chỉnh sửa nội dung được thực hiện ở nguồn rồi sinh lại sách.</p><p><strong>Về tác giả và độ tin cậy.</strong> Nội dung được soạn với sự hỗ trợ của trợ lý AI Claude. Các mục “Ghi chép thực chiến” là góc nhìn của người viết, tổng hợp từ thực hành kỹ thuật phổ biến — không phải số liệu hay sự kiện có thật. Các mục “Tình huống mở đầu” là tình huống giả định. Số liệu thật (lãi suất, quy định, mốc thời gian, kết quả nghiên cứu) đều gắn nguồn và ngày kiểm tra; điều gì chưa kiểm chứng được thì sách không nêu con số. Dữ liệu trong biểu đồ và mô phỏng là dữ liệu tổng hợp (mô phỏng) và được ghi nhãn như vậy.</p><p>Văn bản pháp luật, quy định và chuẩn mực thay đổi theo thời gian; hãy đọc bản hiện hành trước khi áp dụng vào công việc thật.</p><p class="small">Ngày kiểm tra nguồn gần nhất trong dữ liệu: ${fmtDate(env.bundle.lessons.map((l) => l.lastVerified).sort().at(-1) ?? '2026-11-07')}.</p></section>`
}

export function preface(env: Env): string {
  const parts = env.model.parts
    .map((p) => `<li><strong>Phần ${roman(p.partNo)} — ${esc(p.track.title.vi)}.</strong> ${md(p.track.summary)} (${p.chapters.length} chương, ${p.chapters.reduce((a, c) => a + c.lessons.length, 0)} bài)</li>`)
    .join('')
  return `<section class="front">${heading(env, 1, 'Lời nói đầu', { toc: true, id: 'preface', cls: 'front-h' })}
<p>Người làm kỹ thuật ngày nay thường phải đứng ở giao điểm của ba thế giới: tài chính (tiền, rủi ro, thị trường, thanh toán), trí tuệ nhân tạo (mô hình ngôn ngữ, tác nhân, đánh giá, an toàn) và phát triển web (giao diện, API, cơ sở dữ liệu, vận hành). Mỗi thế giới có ngôn ngữ riêng, và phần lớn tài liệu viết cho người đã ở trong thế giới đó. Cuốn sách này đi ngược lại: nó viết cho một kỹ sư biết lập trình nhưng chưa biết tài chính, hoặc biết web nhưng chưa biết AI, và luôn bắc cầu bằng cách đối chiếu khái niệm lạ với thứ người đọc đã quen.</p>
<p>Sách gồm ba phần, mỗi phần là một lộ trình:</p><ul>${parts}</ul>
<p>Bài nào cũng đi theo một nhịp: một tình huống mở đầu để đặt vấn đề, phần kiến thức cốt lõi với số liệu có nguồn, câu hỏi tự kiểm tra, bài tập, và cuối cùng là một dự án nhỏ để đưa kiến thức vào công việc. Không có bài nào bị “khoá”: bạn có thể đọc theo thứ tự hoặc nhảy tới chỗ cần; các khái niệm nên biết trước được nêu ở Phụ lục F.</p>
<p>Điều tôi mong ở bạn không phải là thuộc lòng mà là biết hỏi đúng: con số này đến từ đâu, giả định nào đứng sau nó, nếu giả định sai thì chuyện gì xảy ra. Đó cũng là lý do mỗi số liệu thật trong sách đều kèm nguồn, và những chỗ chưa kiểm chứng được thì sách nói rõ thay vì đoán.</p></section>`
}

export function readingGuide(env: Env): string {
  return `<section class="front">${heading(env, 1, 'Cách đọc cuốn sách này', { toc: true, id: 'guide', cls: 'front-h' })}
<p>Các khung trong sách có chức năng cố định, để bạn nhận ra ngay mình đang đọc loại nội dung nào.</p>
<table class="data"><thead><tr><th style="width:26%">Khung</th><th>Ý nghĩa</th></tr></thead><tbody>
<tr><td><strong>Tình huống mở đầu</strong></td><td>Tình huống minh hoạ giả định, dựng để đặt vấn đề — không phải sự kiện có thật.</td></tr>
<tr><td><strong>Ghi chép thực chiến</strong></td><td>Góc nhìn của người viết, kinh nghiệm để cân nhắc — không phải số liệu hay sự kiện có thật.</td></tr>
<tr><td><strong>Khởi động</strong></td><td>Câu hỏi đoán trước khi đọc; sai cũng không sao, mục đích là đọc có chủ đích.</td></tr>
<tr><td><strong>Ví dụ giải từng bước</strong></td><td>Bài toán có lời giải chi tiết; các bước đánh dấu ✎ nên tự tính trước rồi mới đối chiếu đáp số.</td></tr>
<tr><td><strong>Câu hỏi tự kiểm tra</strong></td><td>Đặt ngay trong bài; đáp án ở Phụ lục A.</td></tr>
<tr><td><strong>Bài tập</strong></td><td>Cuối bài; lời giải ở Phụ lục B.</td></tr>
<tr><td><strong>Thực hành lập trình</strong></td><td>Bài viết mã Python có bộ kiểm thử tự chấm; lời giải mẫu và kiểm thử ở Phụ lục C.</td></tr>
<tr><td><strong>Mô phỏng</strong></td><td>Bản in của mô phỏng tương tác trên website, kèm biểu đồ ở tham số mặc định và gợi ý “thử phá nó”.</td></tr>
<tr><td><strong>Ca nghiên cứu / Tình huống nhập vai</strong></td><td>Trình bày ở Phụ lục D và E; trong bài chỉ có khung tóm tắt dẫn tới phụ lục.</td></tr>
<tr><td><strong>Dự án thực hành</strong></td><td>Việc nhỏ gắn với công việc thật, có sản phẩm bàn giao rõ ràng.</td></tr>
</tbody></table>
<p>Các số trong ngoặc vuông, ví dụ <sup class="cite">[12]</sup>, chỉ tới mục tương ứng ở Phụ lục G (Tài liệu tham khảo). Số liệu mô phỏng luôn được ghi nhãn “Dữ liệu tổng hợp (mô phỏng)”. Số thập phân dùng dấu phẩy, hàng nghìn dùng dấu chấm.</p></section>`
}

export function methods(env: Env): string {
  const m = env.bundle.config.methods
  const h1 = heading(env, 1, 'Cách học trong sách này', { toc: true, id: 'methods', cls: 'front-h' })
  const items = m.methods
    .map((x) => `<div class="method">${heading(env, 3, x.name.vi, { cls: 'sub', html: esc(x.name.vi) + x.sourceIds.map(env.cite).join('') })}<p>${md(x.summary)}</p><p><strong>Bằng chứng.</strong> ${md(x.evidence)}</p><p><strong>Giới hạn.</strong> ${md(x.caveat)}</p></div>`)
    .join('')
  return `<section class="front">${h1}${mdb(m.intro)}${items}</section>`
}

export function tocShell(env: Env): string {
  return `<section class="toc">${heading(env, 1, 'Mục lục', { toc: false, id: 'toc-title', cls: 'front-h' })}%%TOC%%</section>`
}

export function tocBody(env: Env): string {
  return env.outline.items
    .filter((i) => i.toc)
    .map((i) => {
      const pg = env.pages.get(i.id)
      return `<div class="toc-l toc-${i.level}"><a href="#${i.id}" class="t">${esc(i.text)}</a><span class="dots"></span><span class="pg">${pg ?? ''}</span></div>`
    })
    .join('')
}

function rail(part: PartEntry): string {
  const n = part.chapters.length
  const step = 610 / n
  const c = part.track.color
  const nodes = part.chapters
    .map((ch, i) => {
      const x = step * (i + 0.5)
      const words = ch.stage.title.vi.split(' ')
      const lines: string[] = []
      let cur = ''
      for (const w of words) {
        if (cur && (cur + ' ' + w).length > Math.max(9, Math.floor(step / 5.4))) {
          lines.push(cur)
          cur = w
        } else cur = cur ? `${cur} ${w}` : w
      }
      if (cur) lines.push(cur)
      const t = lines.map((l, k) => `<tspan x="${x.toFixed(1)}" dy="${k ? 11 : 0}">${esc(l)}</tspan>`).join('')
      return `<circle cx="${x.toFixed(1)}" cy="22" r="11" fill="#fff" stroke="${c}" stroke-width="3"/><text x="${x.toFixed(1)}" y="26" font-size="11" text-anchor="middle" font-weight="bold" fill="#111" font-family="'Times New Roman','Liberation Serif',serif">${ch.chapterNo}</text><text x="${x.toFixed(1)}" y="50" font-size="9.5" text-anchor="middle" fill="#222" font-family="'Times New Roman','Liberation Serif',serif">${t}</text>`
    })
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 610 100" width="100%"><line x1="6" x2="604" y1="22" y2="22" stroke="${c}" stroke-width="5" stroke-linecap="round"/>${nodes}</svg>`
}

export function partOpener(env: Env, part: PartEntry): string {
  const list = part.chapters
    .map((ch) => `<li><strong>Chương ${ch.chapterNo}. ${esc(ch.stage.title.vi)}</strong> — ${md(ch.stage.summary)} <span class="lessons-n">(${ch.lessons.length} bài)</span></li>`)
    .join('')
  return `<section class="part" style="--c:${part.track.color}"><div class="part-band"></div><p class="part-no">PHẦN ${roman(part.partNo)}</p>${heading(env, 1, `Phần ${roman(part.partNo)}. ${part.track.title.vi}`, { toc: true, id: part.anchor, html: esc(part.track.title.vi), match: part.track.title.vi, cls: 'part-title' })}<p class="part-en">${esc(part.track.title.en)}</p><p class="part-sum">${md(part.track.summary)}</p><figure class="rail">${rail(part)}<figcaption>Bản đồ lộ trình: mỗi nút là một chương, đọc từ trái sang phải.</figcaption></figure><ol class="part-list">${list}</ol></section>`
}

export function chapterOpener(env: Env, ch: ChapterEntry): string {
  const lessons = ch.lessons.map((l) => `<li><span class="lno">${l.no}</span> ${esc(l.lesson.title.vi)} <span class="lmin">${l.lesson.estMinutes} phút</span></li>`).join('')
  const minutes = ch.lessons.reduce((a, l) => a + l.lesson.estMinutes, 0)
  return `<section class="chapter-open">${heading(env, 2, `Chương ${ch.chapterNo}. ${ch.stage.title.vi}`, { toc: true, id: ch.anchor, cls: 'chapter-title', html: `<span class="ch-no">Chương ${ch.chapterNo}</span>${esc(ch.stage.title.vi)}` })}<p class="part-en">${esc(ch.stage.title.en)}</p><p class="ch-sum">${md(ch.stage.summary)}</p><div class="ch-box"><p><strong>Trong chương này</strong> (${ch.lessons.length} bài, khoảng ${Math.round(minutes / 60 * 10) / 10} giờ đọc):</p><ul class="ch-list">${lessons}</ul></div></section>`
}

