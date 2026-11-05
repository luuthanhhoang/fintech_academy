import type { Lesson } from '@/lib/content/types'
import { simulatorHref } from '@/lib/util/href'
import { WhyLink } from '@/components/learn/why-link'
import { QuizItemCard } from '@/components/quiz/quiz-item'
import { ExerciseCard } from './exercise-card'
import { MdxContent } from './mdx-content'
import { SelfExplainSection } from './self-explain-section'

const NONE = {}

/** Quiz, exercises and self-explanation blocks rendered after the lesson body. */
export async function LessonExtras({ lesson }: { lesson: Lesson }) {
  const embedded = new Set([...lesson.body.matchAll(/<Quiz\s+id="([^"]+)"/g)].map((m) => m[1]))
  const remaining = lesson.quiz.filter((q) => !embedded.has(q.id))
  const exercises = await Promise.all(
    lesson.exercises.map(async (e, i) => ({
      e,
      i,
      prompt: <MdxContent source={e.prompt} components={NONE} />,
      hint: e.hint ? <MdxContent source={e.hint} components={NONE} /> : null,
      solution: <MdxContent source={e.solution} components={NONE} />,
    })),
  )
  return (
    <>
      {remaining.length > 0 && (
        <section aria-labelledby="quiz" className="mt-10 font-sans">
          <h2 id="quiz" className="font-serif text-2xl font-semibold" style={{ scrollMarginTop: '5rem' }}>
            Kiểm tra nhanh (Quiz)
          </h2>
          <WhyLink method="retrieval-practice" />
          <div className="mt-4 space-y-4">
            {remaining.map((q, i) => (
              <QuizItemCard key={q.id} item={q} lessonId={lesson.id} context="lesson" index={i} />
            ))}
          </div>
        </section>
      )}
      {exercises.length > 0 && (
        <section aria-labelledby="bai-tap" className="mt-10 font-sans">
          <h2 id="bai-tap" className="font-serif text-2xl font-semibold" style={{ scrollMarginTop: '5rem' }}>
            Bài tập (Exercises)
          </h2>
          <div className="mt-4 space-y-4">
            {exercises.map(({ e, i, prompt, hint, solution }) => (
              <ExerciseCard key={e.id} id={e.id} conceptId={e.conceptId} index={i} prompt={prompt} hint={hint} solution={solution} simulatorHref={e.simulator ? simulatorHref(e.simulator.id, e.simulator.params) : null} />
            ))}
          </div>
        </section>
      )}
      <section aria-labelledby="tu-giai-thich" className="mt-10 rounded-lg border border-rule p-4 sm:p-5">
        <h2 id="tu-giai-thich" className="mb-3 font-serif text-2xl font-semibold" style={{ scrollMarginTop: '5rem' }}>
          Tự giải thích lại
        </h2>
        <div className="-mt-2 mb-3 font-sans"><WhyLink method="self-explanation" /></div>
        <SelfExplainSection targetId={lesson.id} conceptIds={lesson.concepts} prompt={lesson.selfExplain.prompt} rubric={lesson.selfExplain.rubric} />
      </section>
    </>
  )
}
