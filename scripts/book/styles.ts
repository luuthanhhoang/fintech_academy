/** Print stylesheet (A4, Times New Roman, mirrored margins, running headers via named pages). */
import type { Model } from './model'

const SERIF = `"Times New Roman", "Liberation Serif", Tinos, serif`
const MONO = `"Liberation Mono", "Courier New", monospace`
const q = (s: string): string => `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`

function runningHeaders(model: Model, shortTitle: string): string {
  const base = `@page :left { @top-left { content: ${q(shortTitle)}; } @bottom-left { content: counter(page); } }
@page :right { @top-right { content: ""; } @bottom-right { content: counter(page); } }`
  const named = model.chapters
    .map((c) => {
      const label = `Chương ${c.chapterNo} · ${c.stage.title.vi}`
      return `@page ${c.pageName}:right { @top-right { content: ${q(label)}; } }
@page ${c.pageName}:left { @top-left { content: ${q(shortTitle)}; } @top-right { content: ${q(label)}; } }`
    })
    .join('\n')
  return `${base}\n${named}`
}

export function css(model: Model, katexCss: string, shortTitle: string): string {
  return `${katexCss}
@page { size: A4; margin: 24mm 20mm 24mm 20mm; font-family: ${SERIF}; }
@page :left { margin-left: 20mm; margin-right: 26mm; }
@page :right { margin-left: 26mm; margin-right: 20mm; }
@page :left, @page :right { @top-left { font: italic 9pt ${SERIF}; color: #555; vertical-align: bottom; padding-bottom: 5mm; } @top-right { font: italic 9pt ${SERIF}; color: #555; vertical-align: bottom; padding-bottom: 5mm; } @bottom-left { font: 10pt ${SERIF}; color: #333; } @bottom-right { font: 10pt ${SERIF}; color: #333; } }
@page cover { margin: 0; @top-left { content: none; } @top-right { content: none; } @bottom-left { content: none; } @bottom-right { content: none; } }
@page blank { @top-left { content: none; } @top-right { content: none; } @bottom-left { content: none; } @bottom-right { content: none; } }
${runningHeaders(model, shortTitle)}
* { box-sizing: border-box; }
html { font-family: ${SERIF}; font-size: 11.5pt; line-height: 1.42; color: #111; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; font-variant-ligatures: none; }
p { margin: 0 0 6pt; text-align: justify; orphans: 3; widows: 3; }
h1, h2, h3, h4, h5 { font-family: ${SERIF}; break-after: avoid; margin: 0; }
a { color: inherit; text-decoration: none; }
code { font-family: ${MONO}; font-size: 0.86em; background: #f1f1ee; padding: 0 2pt; border-radius: 2pt; }
em { font-style: italic; }
ul, ol { margin: 0 0 6pt 0; padding-left: 16pt; }
li { margin: 0 0 2pt; text-align: justify; }
li > p { margin: 0 0 2pt; }
hr { border: 0; border-top: 0.5pt solid #999; margin: 8pt 0; }
blockquote { margin: 6pt 14pt; font-style: italic; }
sup.cite { font-size: 7.5pt; color: #333; line-height: 0; margin-left: 1pt; }

/* cover & title */
.cover { page: cover; width: 210mm; height: 297mm; position: relative; break-after: page; background: #fbfaf6; overflow: hidden; }
.cover .rails { position: absolute; left: 22mm; top: 0; bottom: 0; display: flex; gap: 3mm; }
.cover .rails i { display: block; width: 4mm; height: 100%; }
.cover-body { position: absolute; left: 52mm; right: 24mm; top: 70mm; }
.cover-kicker { letter-spacing: 3pt; font-size: 11pt; color: #555; text-align: left; margin-bottom: 10mm; }
.cover-title { text-align: left; margin: 0; font-weight: bold; font-size: 54pt; line-height: 1.02; font-weight: bold; letter-spacing: -0.5pt; }
.cover-sub { font-size: 22pt; margin-top: 10mm; text-align: left; line-height: 1.2; }
.cover-tag { font-size: 13pt; font-style: italic; color: #444; margin-top: 8mm; text-align: left; }
.cover-parts { list-style: none; padding: 0; margin: 26mm 0 0; font-size: 13pt; }
.cover-parts li { margin-bottom: 3mm; text-align: left; }
.cover-ed { position: absolute; left: 52mm; bottom: 20mm; font-size: 10.5pt; color: #555; text-align: left; }
.titlepage { page: blank; break-before: page; break-after: page; padding-top: 70mm; text-align: center; }
.tp-title { text-align: center; font-size: 30pt; font-weight: bold; margin: 0; }
.tp-sub { font-size: 17pt; text-align: center; margin-top: 8mm; }
.tp-rule { width: 40mm; border-top: 1.2pt solid #222; margin: 14mm auto; }
.tp-line, .tp-ed { text-align: center; font-size: 11.5pt; color: #333; }
.copyright { page: blank; break-before: page; break-after: page; padding-top: 110mm; font-size: 10pt; }
.copyright p { text-align: left; }
.small { font-size: 9pt; color: #555; }

/* front matter */
.front, .toc { break-before: right; }
.front-h { font-size: 24pt; font-weight: bold; margin-bottom: 14pt; padding-bottom: 6pt; border-bottom: 1.2pt solid #222; }
.method { margin-bottom: 8pt; }
.method h3 { font-size: 13pt; }
.toc-l { display: flex; align-items: baseline; gap: 4pt; font-size: 10.5pt; line-height: 1.3; }
.toc-l .t { flex: 0 1 auto; }
.toc-l .dots { flex: 1 1 auto; border-bottom: 0.6pt dotted #777; transform: translateY(-2pt); min-width: 10pt; }
.toc-l .pg { flex: 0 0 24pt; text-align: right; }
.toc-1 { font-weight: bold; font-size: 11.5pt; margin-top: 8pt; }
.toc-2 { margin-left: 12pt; font-weight: bold; margin-top: 3pt; }
.toc-3 { margin-left: 28pt; }

/* parts & chapters */
.part { break-before: right; break-after: page; padding-top: 28mm; position: relative; }
.part-band { width: 100%; height: 6mm; background: var(--c); margin-bottom: 14mm; }
.part-no { font-size: 13pt; letter-spacing: 4pt; color: #444; text-align: left; margin-bottom: 4pt; }
.part-title { font-size: 34pt; font-weight: bold; line-height: 1.08; }
.part-en { font-size: 14pt; font-style: italic; color: #444; text-align: left; margin: 4pt 0 10pt; }
.part-sum { font-size: 12.5pt; }
.rail { margin: 14pt 0 10pt; break-inside: avoid; }
.rail figcaption { font-size: 9.5pt; font-style: italic; color: #555; }
.part-list { font-size: 11pt; margin-top: 10pt; }
.part-list li { margin-bottom: 5pt; }
.lessons-n { color: #555; }
.chapter { page: auto; }
.chapter-open { break-before: right; padding-top: 22mm; }
.chapter-title { font-size: 26pt; font-weight: bold; line-height: 1.12; border-bottom: 1.5pt solid var(--c, #333); padding-bottom: 8pt; margin-bottom: 8pt; }
.ch-no { display: block; font-size: 12pt; letter-spacing: 3pt; font-weight: normal; text-transform: uppercase; color: #444; margin-bottom: 4pt; }
.ch-sum { font-size: 12pt; }
.ch-box { margin-top: 14pt; border: 0.75pt solid #999; padding: 8pt 12pt; background: #fafafa; break-inside: avoid; }
.ch-list { list-style: none; padding: 0; margin: 4pt 0 0; font-size: 11pt; }
.ch-list li { display: flex; gap: 6pt; margin-bottom: 3pt; }
.lno { font-weight: bold; min-width: 22pt; }
.lmin { margin-left: auto; color: #555; font-size: 10pt; white-space: nowrap; }

/* lessons */
.lesson { break-before: page; }
.lesson-title { font-size: 19pt; font-weight: bold; line-height: 1.18; margin-bottom: 2pt; padding-bottom: 4pt; border-bottom: 0.9pt solid #222; }
.lesson-title .no { color: var(--c, #333); margin-right: 6pt; }
.en-title { font-style: italic; color: #444; margin: 3pt 0 2pt; text-align: left; }
.meta { font-size: 9.5pt; color: #555; text-align: left; margin-bottom: 8pt; }
.lead { margin: 8pt 0; padding: 4pt 0 4pt 12pt; border-left: 3pt solid var(--c, #333); font-size: 12.5pt; font-style: italic; break-inside: avoid; }
.lead-k { display: block; font-style: normal; font-size: 9pt; letter-spacing: 1.5pt; text-transform: uppercase; color: #555; margin-bottom: 2pt; }
.abstract { background: #f4f4f1; padding: 7pt 10pt; margin: 8pt 0; font-size: 10.5pt; break-inside: avoid; }
.abstract p { margin-bottom: 3pt; }
.sub { font-size: 13.5pt; font-weight: bold; margin: 12pt 0 4pt; }
h5.sub { font-size: 12pt; font-style: italic; }
.body > h4.sub:first-child { margin-top: 4pt; }
.term { font-style: italic; }
.fact { background: #eef3ea; padding: 0 2pt; }
.sidenote { margin: 6pt 0 6pt 14pt; padding-left: 8pt; border-left: 1pt solid #888; font-size: 10pt; color: #333; }

/* boxes */
.box-h { background: #e8e8e4; border-bottom: 0.6pt solid #999; padding: 3pt 8pt; font-size: 10.5pt; font-weight: bold; display: flex; justify-content: space-between; gap: 10pt; break-after: avoid; }
.box-h em { font-weight: normal; font-size: 9pt; color: #555; }
.callout, .quiz, .exercise, .application, .pretest, .devmap, .selfx, .lab, .sim, .example, .refs, .ref-box { margin: 8pt 0; border: 0.7pt solid #8a8a85; background: #fff; }
.callout > :not(.box-h), .quiz > :not(.box-h), .exercise > :not(.box-h), .application > :not(.box-h), .pretest > :not(.box-h), .selfx > :not(.box-h), .lab > :not(.box-h), .sim > :not(.box-h), .example > :not(.box-h), .refs > :not(.box-h), .devmap > :not(.box-h) { margin-left: 9pt; margin-right: 9pt; }
.callout > :not(.box-h):last-child, .quiz > :last-child, .exercise > :last-child, .application > :last-child, .selfx > :last-child, .example > :last-child { margin-bottom: 6pt; }
.callout > .box-h + *, .quiz > .box-h + *, .exercise > .box-h + *, .application > .box-h + *, .pretest > .box-h + *, .selfx > .box-h + *, .lab > .box-h + *, .sim > .box-h + *, .example > .box-h + *, .refs > .box-h + *, .devmap > .box-h + * { margin-top: 6pt; }
.callout-story { border-left: 3.5pt solid var(--c, #444); background: #faf8f1; }
.callout-story .box-h { background: #f0ebda; }
.callout-field { border-left: 3.5pt solid #5b6b7a; background: #f3f5f7; }
.callout-field .box-h { background: #e3e8ed; }
.callout-warning { border-left: 3.5pt solid #a8611b; background: #fbf3e6; }
.disc { font-size: 9pt; font-style: italic; color: #555; text-align: left; }
.quiz, .exercise, .application, .pretest, .selfx { break-inside: avoid; }
.q-prompt p:last-child { margin-bottom: 4pt; }
.opts { list-style: none; padding: 0; margin: 2pt 9pt 6pt; }
.opts li { padding-left: 18pt; position: relative; margin-bottom: 2pt; }
.opts li::before { content: attr(data-l) "."; position: absolute; left: 2pt; font-weight: bold; }
.order { list-style: none; padding-left: 4pt; }
.blank { margin: 4pt 9pt 6pt; }
.hint { font-size: 10pt; font-style: italic; color: #444; text-align: left; }
.check { list-style: none; padding-left: 4pt; }
.check li::before { content: "☐ "; }
.example { border-left: 3pt solid var(--c, #444); background: #fcfcfa; }
.ex-problem { margin-bottom: 4pt; }
.steps { margin-left: 22pt; margin-right: 9pt; }
.steps li { margin-bottom: 4pt; }
.self-calc { margin-top: 3pt; padding: 3pt 6pt; border: 0.6pt dashed #777; font-size: 10.5pt; background: #fff; text-align: left; }
.self-ans { margin-left: 4pt; font-weight: bold; white-space: nowrap; }
.takeaway { background: #f1f1ed; padding: 4pt 7pt; margin-bottom: 6pt; }
.application dl { margin: 6pt 9pt; }
.application dt { font-weight: bold; margin-top: 3pt; }
.application dd { margin: 0 0 3pt 0; text-align: justify; }
.lab { border-width: 1pt; }
.lab .box-h { background: #dfe3e8; }
.lab-ins { font-size: 10.5pt; }
.cap { font-size: 10pt; margin: 4pt 9pt 2pt; text-align: left; }
.sim .box-h { background: #e2ebe0; }
.sim-ref, .ref-box { margin: 8pt 0; padding: 6pt 9pt; background: #f6f6f3; border: 0.7pt solid #aaa; font-size: 10.5pt; break-inside: avoid; }
.synthetic { font-size: 10pt; font-style: italic; background: #fff6df; padding: 2pt 6pt; border: 0.5pt solid #d9c27a; text-align: left; }
.how { font-size: 10.5pt; }
.refs ul { list-style: none; padding: 0; font-size: 10pt; margin-bottom: 6pt; }
.refs li { margin-bottom: 1pt; text-align: left; }
.pretest p { text-align: left; }

/* figures, code, tables, math */
figure { margin: 10pt 0; break-inside: avoid; text-align: center; }
figure svg { max-width: 100%; height: auto; }
figcaption { font-size: 10pt; text-align: left; margin-top: 3pt; color: #222; }
.fig-note { font-size: 10pt; text-align: left; }
pre.code { margin: 6pt 0; padding: 5pt 7pt; font-family: ${MONO}; font-size: 8.6pt; line-height: 1.32; background: #f6f6f3; border: 0.5pt solid #c7c7c0; border-left: 2.5pt solid #7d8a96; white-space: pre-wrap; overflow-wrap: anywhere; break-inside: auto; text-align: left; }
pre.code code { background: none; padding: 0; font-size: inherit; }
.lab pre.code, .app-block pre.code { margin-left: 9pt; margin-right: 9pt; }
.app-block > pre.code { margin-left: 0; margin-right: 0; }
.tok-c { color: #5d6b5d; font-style: italic; } .tok-s { color: #8a3b17; } .tok-k { color: #1b3f7a; font-weight: bold; } .tok-n { color: #6a3a91; }
table.data { width: 100%; border-collapse: collapse; margin: 6pt 0 8pt; font-size: 10pt; border-top: 1pt solid #222; border-bottom: 1pt solid #222; }
.callout table.data, .devmap table.data, .sim table.data { width: calc(100% - 18pt); margin-left: 9pt; margin-right: 9pt; }
table.data th { text-align: left; background: #efefeb; border-bottom: 0.7pt solid #222; padding: 3pt 5pt; vertical-align: bottom; }
table.data td { padding: 3pt 5pt; border-bottom: 0.4pt solid #ccc; vertical-align: top; text-align: left; overflow-wrap: anywhere; }
table.data tr { break-inside: avoid; }
.math-display { margin: 6pt 0; text-align: center; overflow-x: hidden; }
.katex { font-size: 1.04em; }

/* appendices */
.appendix { break-before: right; }
.appendix > h1 { font-size: 24pt; font-weight: bold; margin-bottom: 12pt; padding-bottom: 6pt; border-bottom: 1.2pt solid #222; }
.app-no { display: block; font-size: 12pt; letter-spacing: 3pt; text-transform: uppercase; font-weight: normal; color: #444; margin-bottom: 3pt; }
.intro { font-style: italic; color: #333; }
.app-chapter { font-size: 12.5pt; font-weight: bold; margin: 14pt 0 4pt; padding-bottom: 2pt; border-bottom: 0.7pt solid #777; break-after: avoid; }
.app-lesson { font-size: 11.5pt; font-weight: bold; margin: 8pt 0 3pt; font-style: italic; }
.app-h3 { font-size: 15pt; font-weight: bold; margin: 14pt 0 4pt; padding-bottom: 3pt; border-bottom: 0.7pt solid #222; }
.app-block.case, .app-block.scenario { break-before: page; }
.ans { margin: 0 0 6pt; padding-left: 8pt; border-left: 1.5pt solid #aaa; font-size: 10.5pt; break-inside: avoid; }
.ans p { margin-bottom: 2pt; text-align: left; }
.ans-n { display: inline-block; font-weight: bold; font-size: 9.5pt; color: #444; margin-bottom: 1pt; }
.was { font-style: italic; color: #444; font-size: 10pt; }
.node { margin: 6pt 0; padding: 5pt 8pt; border: 0.6pt solid #aaa; break-inside: avoid; }
.node-n { font-weight: bold; font-size: 10pt; color: #333; }
.choices { list-style: none; padding-left: 0; }
.goto { font-weight: bold; white-space: nowrap; }
.fb { font-size: 10pt; font-style: italic; color: #444; margin: 1pt 0 3pt 12pt; }
.ending { background: #f1f1ed; padding: 3pt 6pt; }
.letter { font-size: 14pt; font-weight: bold; margin: 10pt 0 3pt; border-bottom: 0.6pt solid #888; break-after: avoid; }
.gl { font-size: 10.5pt; margin-bottom: 3pt; text-align: justify; break-inside: avoid; }
.gl .en, .gl .where { color: #555; } .gl .pre { color: #333; font-style: italic; }
.bib { display: flex; gap: 6pt; font-size: 9.5pt; margin-bottom: 3pt; break-inside: avoid; }
.bn { flex: 0 0 24pt; font-weight: bold; }
.bib .url { font-family: ${MONO}; font-size: 8pt; overflow-wrap: anywhere; }
.bnote { color: #444; font-style: italic; }
`
}
