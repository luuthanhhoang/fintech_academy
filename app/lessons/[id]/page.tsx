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
        <header className="mb-8 font-sans">
          <p className="text-xs text-ink-3">
            <Link href={`/tracks/${lesson.track}/`} className="hover:underline">{track?.title.vi}</Link> · <Link href={`/tracks/${lesson.track}/#${lesson.stage}`} className="hover:underline">{stage?.title.vi}</Link>
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight sm:text-4xl">{lesson.title.vi}</h1>
          <p className="mt-1 text-ink-3">{lesson.title.en}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-3">
            <StatusBadge status={lesson.status} />
            <span>~{lesson.estMinutes} phút</span>
            <span>· kiểm tra {lesson.lastVerified}</span>
            {concepts.map((c) => (
              <Link key={c.id} href={`/concepts/${c.id}/`}>
                <Tag>{c.name.vi}</Tag>
              </Link>
            ))}
          </div>
          <blockquote className="mt-6 border-l-4 border-accent bg-accent-soft px-4 py-3 font-serif text-lg italic">
            <span className="mb-1 block font-sans text-xs font-semibold not-italic text-accent">Câu hỏi tại sao</span>
            {lesson.whyQuestion}
          </blockquote>
        </header>
        <details className="mb-6 rounded-md border border-rule px-4 py-2 font-sans text-sm xl:hidden">
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
