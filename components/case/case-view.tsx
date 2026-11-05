import type { CaseStudy } from '@/lib/content/schema/case'
import type { Source } from '@/lib/content/schema/source'
import { StatusBadge } from '@/components/ui/badges'
import { CaseQuestions } from './case-questions'

function Cite({ ids, sources }: { ids: string[]; sources: Source[] }) {
  return (
    <span className="ml-1 text-xs">
      {ids.map((id) => {
        const s = sources.find((x) => x.id === id)
        const n = sources.findIndex((x) => x.id === id) + 1
        return s ? (
          <a key={id} href={s.url} target="_blank" rel="noreferrer" title={`${s.title} — ${s.publisher}`} className="mr-1 text-accent">
            [{n}]
          </a>
        ) : null
      })}
    </span>
  )
}

export function CaseView({ cs, sources }: { cs: CaseStudy; sources: Source[] }) {
  return (
    <div className="font-sans">
      <section aria-labelledby="timeline">
        <h2 id="timeline" className="font-serif text-2xl font-semibold">Dòng thời gian</h2>
        <ol className="mt-4 border-l-2 border-rule">
          {cs.timeline.map((e, i) => (
            <li key={i} className="relative mb-5 pl-5">
              <span aria-hidden="true" className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full border-2 border-accent bg-paper" />
              <p className="num text-xs text-ink-3">{e.date}</p>
              <p className="mt-0.5">
                {e.event}
                <Cite ids={e.sourceIds} sources={sources} />
              </p>
              {e.status !== 'verified' && (
                <span className="mt-1 inline-block">
                  <StatusBadge status={e.status} />
                </span>
              )}
            </li>
          ))}
        </ol>
      </section>
      <section aria-labelledby="root" className="mt-8">
        <h2 id="root" className="font-serif text-2xl font-semibold">Nguyên nhân gốc rễ</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          {cs.rootCauses.map((r, i) => (
            <li key={i}>
              {r.text}
              <Cite ids={r.sourceIds} sources={sources} />
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="questions" className="mt-8">
        <h2 id="questions" className="font-serif text-2xl font-semibold">Bạn sẽ chặn thế nào?</h2>
        <CaseQuestions caseId={cs.id} conceptIds={cs.concepts} questions={cs.questions} />
      </section>
      <section aria-labelledby="controls" className="mt-8">
        <h2 id="controls" className="font-serif text-2xl font-semibold">Các lớp kiểm soát (gợi ý đối chiếu)</h2>
        <p className="mt-1 text-sm text-ink-3">Đây là phân tích sư phạm của site, đối chiếu với các phát hiện trong nguồn — không phải trích dẫn nguyên văn.</p>
        <dl className="mt-3 divide-y divide-rule rounded-lg border border-rule">
          {cs.controls.map((c, i) => (
            <div key={i} className="p-3">
              <dt className="font-medium">{c.control}</dt>
              <dd className="mt-0.5 text-sm text-ink-2">Ánh xạ dev: {c.devAnalogy}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section aria-labelledby="case-sources" className="mt-8 border-t border-rule pt-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="case-sources" className="font-serif text-xl font-semibold">Nguồn</h2>
          <StatusBadge status={cs.status} />
          <span className="text-xs text-ink-3">Kiểm tra lần cuối: {cs.lastVerified}</span>
        </div>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm">
          {sources.map((s) => (
            <li key={s.id}>
              <a href={s.url} target="_blank" rel="noreferrer" className="text-accent underline">{s.title}</a>
              <span className="text-ink-3"> — {s.publisher}. Truy cập {s.accessed}.</span>
              {s.note && <span className="block text-xs text-ink-3">{s.note}</span>}
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
