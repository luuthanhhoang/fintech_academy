import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { lessonNav } from '@/lib/content/lesson-nav'
import { lessonSections } from '@/lib/content/sections'
import { getContent, getLesson, sourcesById } from '@/lib/content/server'
import { ApplicationsList } from '@/components/learn/applications'
import { PretestBlock } from '@/components/learn/pretest'
import { DevMappingTable } from '@/components/reader/dev-mapping'
import { LessonActions } from '@/components/reader/lesson-actions'
import { LessonExtras } from '@/components/reader/lesson-extras'
import { LessonPager, LessonRail } from '@/components/reader/lesson-rail'
import { lessonComponents } from '@/components/reader/lesson-mdx-map'
import { MdxContent } from '@/components/reader/mdx-content'
import { NotesPanel } from '@/components/reader/notes'
import { SourcesList } from '@/components/reader/sources'
import { ReadingAids } from '@/components/reader/toc'
import { StatusBadge, Tag } from '@/components/ui/badges'
import { minutes } from '@/components/ui/primitives'
import { fmtDay } from '@/lib/util/format'

export const dynamicParams = false

export function generateStaticParams() {
  return getContent().lessons.map((l) => ({ id: l.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const lesson = getLesson((await params).id)
  return lesson ? { title: lesson.title.vi, description: lesson.summary } : {}
}

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lesson = getLesson(id)
  if (!lesson) notFound()
  const bundle = getContent()
  const track = bundle.tracks.find((t) => t.id === lesson.track)
  const stage = track?.stages.find((s) => s.id === lesson.stage)
  const concepts = lesson.concepts.map((c) => bundle.concepts.find((x) => x.id === c)).filter((c) => c !== undefined)
  const toc = lessonSections(lesson.body).filter((s) => s.slug)
  const nav = lessonNav(bundle, lesson.id)
  const rail = nav && track && stage ? { items: nav.stageLessons, currentId: lesson.id, trackId: track.id, trackTitle: track.title.vi, stageId: stage.id, stageTitle: stage.title.vi } : null

  return (
    <div className="xl:grid xl:grid-cols-[230px_minmax(0,1fr)_210px] xl:gap-8">
      <aside className="hidden xl:block">
        <div className="sticky top-[calc(var(--topbar)+1.5rem)] max-h-[calc(100dvh-var(--topbar)-3rem)] overflow-y-auto pr-2">{rail && <LessonRail {...rail} />}</div>
      </aside>
      <article className="min-w-0">
        <header className="mb-10 font-sans">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-3">
            <span aria-hidden="true" className="h-[6px] w-6 rounded-full" style={{ background: `var(--line-${lesson.track})` }} />
            <Link href={`/tracks/${lesson.track}/`} className="hover:text-ink hover:underline">{track?.title.vi}</Link>
            <span aria-hidden="true">›</span>
            <Link href={`/tracks/${lesson.track}/#${lesson.stage}`} className="hover:text-ink hover:underline">Ga {lesson.stage.toUpperCase()} · {stage?.title.vi}</Link>
          </p>
          <h1 className="mt-3 max-w-[22ch] font-display text-[1.9rem] font-bold leading-[1.15] sm:text-[2.3rem]">{lesson.title.vi}</h1>
          <p lang="en" className="mt-2 text-ink-3">{lesson.title.en}</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-ink-2">
            <span>{minutes(lesson.estMinutes)}</span>
            <StatusBadge status={lesson.status} />
            <span className="text-ink-3">Kiểm tra nguồn ngày {fmtDay(lesson.lastVerified)}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {concepts.map((c) => (
              <Link key={c.id} href={`/concepts/${c.id}/`} className="hover:opacity-80">
                <Tag>{c.name.vi}</Tag>
              </Link>
            ))}
          </div>
          <blockquote className="mt-8 border-l-[6px] py-1 pl-5" style={{ borderColor: `var(--line-${lesson.track})` }}>
            <span className="block font-sans text-sm font-semibold text-ink-3">Câu hỏi bài này trả lời</span>
            <span className="mt-1 block font-[family-name:var(--font-read)] text-xl italic leading-snug text-ink sm:text-2xl">{lesson.whyQuestion}</span>
          </blockquote>
        </header>
        <details className="mb-8 rounded-2xl bg-card px-5 py-3 font-sans text-sm ring-1 ring-rule/70 xl:hidden">
          <summary className="cursor-pointer text-ink-2">Trong chặng này · Mục lục</summary>
          {rail && <div className="mt-3"><LessonRail {...rail} /></div>}
          <ol className="mt-3 space-y-1 border-t border-rule pt-3">
            {toc.map((t) => (
              <li key={t.slug} style={{ paddingLeft: `${(t.depth - 2) * 0.75}rem` }}>
                <a href={`#${t.slug}`} className="text-accent">{t.heading}</a>
              </li>
            ))}
          </ol>
        </details>
        <div className="max-w-[46rem]">
          <PretestBlock lessonId={lesson.id} items={lesson.quiz.filter((q) => lesson.pretest.includes(q.id))} />
        </div>
        <div id="lesson-body" className="prose-notebook max-w-[46rem]">
          <MdxContent source={lesson.body} components={lessonComponents(lesson, bundle)} />
        </div>
        <div className="max-w-[46rem]">
          <DevMappingTable items={lesson.devMapping} />
          <ApplicationsList conceptIds={lesson.concepts} items={lesson.applications} />
          <LessonExtras lesson={lesson} />
          <LessonActions lessonId={lesson.id} concepts={concepts.map((c) => ({ id: c.id, name: c.name }))} />
          <NotesPanel lessonId={lesson.id} anchors={toc.map((t) => ({ slug: t.slug, heading: t.heading }))} />
          <SourcesList sources={sourcesById(lesson.sources)} lastVerified={lesson.lastVerified} status={lesson.status} />
          {nav && <LessonPager prev={nav.prev} next={nav.next} />}
        </div>
      </article>
      <aside className="hidden xl:block">
        <div className="sticky top-10">
          <ReadingAids lessonId={lesson.id} items={toc.map((t) => ({ slug: t.slug, heading: t.heading, depth: t.depth }))} />
        </div>
      </aside>
    </div>
  )
}
