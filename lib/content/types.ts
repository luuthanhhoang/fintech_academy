import type { CaseStudy } from './schema/case'
import type { Concept } from './schema/concept'
import type {
  MasteryConfig, SearchConfig, Shortcut, SiteConfig, SrsConfig, TodayConfig, TutorConfig,
} from './schema/config'
import type { Exercise } from './schema/exercise'
import type { Lab } from './schema/lab'
import type { Diagram, LearningMethod, PracticeConfig, Scenario, WorkedExample } from './schema/learning'
import type { LessonFrontmatter, PlannedLesson } from './schema/lesson'
import type { QuizItem } from './schema/quiz'
import type { Simulator } from './schema/simulator'
import type { Source } from './schema/source'
import type { Track } from './schema/track'

export type Lesson = LessonFrontmatter & { body: string; quiz: QuizItem[]; exercises: Exercise[]; examples: WorkedExample[]; diagrams: Diagram[] }

export interface ContentConfig {
  site: SiteConfig
  shortcuts: Shortcut[]
  mastery: MasteryConfig
  srs: SrsConfig
  today: TodayConfig
  search: SearchConfig
  tutor: TutorConfig
  practice: PracticeConfig
  methods: { intro: string; methods: LearningMethod[] }
}

export interface ContentBundle {
  config: ContentConfig
  tracks: Track[]
  concepts: Concept[]
  lessons: Lesson[]
  planned: PlannedLesson[]
  simulators: Simulator[]
  labs: Lab[]
  cases: CaseStudy[]
  scenarios: Scenario[]
  sources: Source[]
}

export type {
  Diagram, LearningMethod, Scenario, WorkedExample,
  CaseStudy, Concept, Exercise, Lab, LessonFrontmatter, PlannedLesson, QuizItem, Simulator, Source, Track,
}
