/** Build-time content loader (Node only). Reads content/ and validates each file against its zod schema. */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { parse } from 'yaml'
import type { z } from 'zod'
import { splitFrontmatter } from './frontmatter'
import { CaseSchema } from './schema/case'
import { ConceptFileSchema } from './schema/concept'
import {
  MasteryConfigSchema, SearchConfigSchema, ShortcutsConfigSchema, SiteConfigSchema, SrsConfigSchema,
  TodayConfigSchema, TutorConfigSchema,
} from './schema/config'
import { ExerciseFileSchema } from './schema/exercise'
import { LabMetaSchema } from './schema/lab'
import { DiagramFileSchema, ExampleFileSchema, MethodsConfigSchema, PracticeConfigSchema, ScenarioSchema } from './schema/learning'
import { LessonFrontmatterSchema, PlannedFileSchema } from './schema/lesson'
import { QuizFileSchema } from './schema/quiz'
import { SimulatorSchema } from './schema/simulator'
import { SourceFileSchema } from './schema/source'
import { TrackSchema } from './schema/track'
import { GraphicsSchema } from './schema/graphics'
import { AssetsFileSchema } from './schema/assets'
import { FocusConfigSchema, LandmarksFileSchema, MapSchema, MusicFileSchema, ViewsFileSchema, WeatherFileSchema, type WorldBundle } from './schema/world'
import type { ContentBundle, Lesson } from './types'

export class ContentLoadError extends Error {}

function readText(path: string): string {
  return readFileSync(path, 'utf8')
}

function parseWith<S extends z.ZodType>(schema: S, data: unknown, file: string, root: string): z.infer<S> {
  const result = schema.safeParse(data)
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`).join('\n')
    throw new ContentLoadError(`${relative(root, file)} không hợp lệ:\n${issues}`)
  }
  return result.data
}

function parseYaml(text: string, file: string, root: string): unknown {
  try {
    return parse(text)
  } catch (e) {
    throw new ContentLoadError(`${relative(root, file)}: YAML lỗi — ${e instanceof Error ? e.message.split('\n')[0] : String(e)}`)
  }
}

function yamlFile<S extends z.ZodType>(schema: S, file: string, root: string): z.infer<S> {
  return parseWith(schema, parseYaml(readText(file), file, root), file, root)
}

function listFiles(dir: string, ext: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((name) => name.endsWith(ext))
    .sort()
    .map((name) => join(dir, name))
}

function listDirs(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .map((name) => join(dir, name))
    .filter((p) => statSync(p).isDirectory())
    .sort()
}

function loadLesson(dir: string, root: string): Lesson {
  const file = join(dir, 'lesson.mdx')
  let split: ReturnType<typeof splitFrontmatter>
  try {
    split = splitFrontmatter(readText(file))
  } catch (e) {
    throw new ContentLoadError(`${relative(root, file)}: frontmatter YAML lỗi — ${e instanceof Error ? e.message.split('\n')[0] : String(e)}`)
  }
  const { data, body } = split
  const meta = parseWith(LessonFrontmatterSchema, data, file, root)
  const quizFile = join(dir, 'quiz.yaml')
  const exFile = join(dir, 'exercises.yaml')
  const quiz = existsSync(quizFile) ? yamlFile(QuizFileSchema, quizFile, root).items : []
  const exercises = existsSync(exFile) ? yamlFile(ExerciseFileSchema, exFile, root).exercises : []
  const optional = <T>(name: string, read: (f: string) => T[]): T[] => (existsSync(join(dir, name)) ? read(join(dir, name)) : [])
  const examples = optional('examples.yaml', (f) => yamlFile(ExampleFileSchema, f, root).examples)
  const diagrams = optional('diagrams.yaml', (f) => yamlFile(DiagramFileSchema, f, root).diagrams)
  return { ...meta, body, quiz, exercises, examples, diagrams }
}

function loadConfig(dir: string, root: string): ContentBundle['config'] {
  const at = (name: string) => join(dir, name)
  return {
    site: yamlFile(SiteConfigSchema, at('site.yaml'), root),
    shortcuts: yamlFile(ShortcutsConfigSchema, at('shortcuts.yaml'), root).shortcuts,
    mastery: yamlFile(MasteryConfigSchema, at('mastery.yaml'), root),
    srs: yamlFile(SrsConfigSchema, at('srs.yaml'), root),
    today: yamlFile(TodayConfigSchema, at('today.yaml'), root),
    search: yamlFile(SearchConfigSchema, at('search.yaml'), root),
    tutor: yamlFile(TutorConfigSchema, at('tutor.yaml'), root),
    practice: yamlFile(PracticeConfigSchema, at('practice.yaml'), root),
    methods: yamlFile(MethodsConfigSchema, at('methods.yaml'), root),
    focus: yamlFile(FocusConfigSchema, at('focus.yaml'), root),
  }
}

function loadWorld(dir: string, root: string): WorldBundle {
  const at = (name: string) => join(dir, name)
  const marks = yamlFile(LandmarksFileSchema, at('landmarks.yaml'), root)
  const views = yamlFile(ViewsFileSchema, at('views.yaml'), root)
  return {
    map: yamlFile(MapSchema, at('map.yaml'), root),
    graphics: yamlFile(GraphicsSchema, at('graphics.yaml'), root),
    assets: yamlFile(AssetsFileSchema, at('assets.yaml'), root),
    landmarks: marks.landmarks,
    guides: marks.guides,
    views: views.views,
    defaultView: views.defaultView,
    weather: yamlFile(WeatherFileSchema, at('weather.yaml'), root),
    music: yamlFile(MusicFileSchema, at('music.yaml'), root),
  }
}

/** Loads the whole content tree. `root` defaults to the repository root (process.cwd()). */
export function loadContent(root: string = process.cwd(), contentDir = 'content'): ContentBundle {
  const base = join(root, contentDir)
  const tracks = listFiles(join(base, 'tracks'), '.yaml').map((f) => yamlFile(TrackSchema, f, root))
  const concepts = listDirs(join(base, 'concepts')).flatMap((dir) =>
    listFiles(dir, '.yaml').flatMap((f) => {
      const file = yamlFile(ConceptFileSchema, f, root)
      return file.concepts.map((c) => ({ ...c, track: file.track, stage: file.stage }))
    }),
  )
  const lessons = listDirs(join(base, 'lessons')).flatMap((trackDir) =>
    listDirs(trackDir).map((dir) => loadLesson(dir, root)),
  )
  const planned = listFiles(join(base, 'planned'), '.yaml').flatMap((f) => {
    const file = yamlFile(PlannedFileSchema, f, root)
    return file.lessons.map((l) => ({ ...l, track: file.track, status: 'planned' as const }))
  })
  const simulators = listFiles(join(base, 'simulators'), '.yaml').map((f) => yamlFile(SimulatorSchema, f, root))
  const labs = listDirs(join(base, 'labs')).map((dir) => ({
    ...yamlFile(LabMetaSchema, join(dir, 'lab.yaml'), root),
    starter: readText(join(dir, 'starter.py')),
    tests: readText(join(dir, 'tests.py')),
    solution: readText(join(dir, 'solution.py')),
  }))
  const cases = listFiles(join(base, 'cases'), '.yaml').map((f) => yamlFile(CaseSchema, f, root))
  const scenarios = listFiles(join(base, 'scenarios'), '.yaml').map((f) => yamlFile(ScenarioSchema, f, root))
  const sources = listFiles(join(base, 'sources'), '.yaml').flatMap(
    (f) => yamlFile(SourceFileSchema, f, root).sources,
  )
  return { config: loadConfig(join(base, 'config'), root), world: loadWorld(join(base, 'world'), root), tracks, concepts, lessons, planned, simulators, labs, cases, scenarios, sources }
}
