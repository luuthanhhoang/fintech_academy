/**
 * Schemas for the learning village: the map (terrain, regions, water, rail), landmarks that host site features,
 * guides, views, weather, music and the focus timer. Positions are metres in a square world centred at (0, 0);
 * +x is east, +z is south (towards the sea).
 */
import { z } from 'zod'
import { IdSchema } from './common'
import type { AssetsFile } from './assets'
import type { Graphics } from './graphics'

export const Vec2Schema = z.tuple([z.number(), z.number()])
export type Vec2 = z.infer<typeof Vec2Schema>
const Vec3Schema = z.tuple([z.number(), z.number(), z.number()])
const Unit = z.number().min(0).max(1)

const SpeciesSchema = z.strictObject({ kind: z.string().min(1), weight: z.number().positive() })

export const RegionSchema = z.strictObject({
  id: IdSchema,
  /** The learning track this region embodies; its stages become stations along the region's rail span. */
  track: IdSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  center: Vec2Schema,
  radius: z.number().positive(),
  elevation: z.number(),
  roughness: z.number().nonnegative(),
  biome: z.enum(['lowland', 'highland']),
  /** What grows on concept plots: rice paddies or tea terraces. */
  plot: z.enum(['paddy', 'tea']),
  /** Fraction range of the rail line (0..1) whose stations belong to this region. */
  railSpan: z.tuple([Unit, Unit]),
  palette: z.strictObject({ ground: z.string(), roof: z.array(z.string()).min(1), wall: z.array(z.string()).min(1) }),
})
export type Region = z.infer<typeof RegionSchema>

export const MapSchema = z.strictObject({
  title: z.string().min(1),
  intro: z.string().min(1),
  seed: z.number().int(),
  size: z.number().positive(),
  resolution: z.number().int().min(32).max(512),
  /** Used only to compute the sun path from your local clock. */
  location: z.strictObject({ latitude: z.number().min(-90).max(90), label: z.string().min(1) }),
  coast: z.strictObject({ z: z.number(), wobble: z.number().nonnegative(), depth: z.number().positive(), beach: z.number().positive() }),
  snowline: z.number(),
  regions: z.array(RegionSchema).min(1),
  peaks: z.array(z.strictObject({ id: IdSchema, name: z.string().min(1), at: Vec2Schema, height: z.number().positive(), radius: z.number().positive() })),
  rivers: z.array(z.strictObject({ id: IdSchema, name: z.string().min(1), width: z.number().positive(), depth: z.number().positive(), points: z.array(Vec2Schema).min(2) })),
  lakes: z.array(z.strictObject({ id: IdSchema, name: z.string().min(1), kind: z.enum(['pond', 'lake']), center: Vec2Schema, radius: z.number().positive(), depth: z.number().positive() })),
  rail: z.strictObject({ name: z.string().min(1), points: z.array(Vec2Schema).min(2), width: z.number().positive() }),
  /** Scenery anchors that views can sit at (porch, lighthouse, pier...). */
  features: z.array(z.strictObject({ id: IdSchema, kind: z.enum(['lighthouse', 'porch', 'pier', 'bench', 'camp']), name: z.string().min(1), at: Vec2Schema })),
  vegetation: z.strictObject({
    trees: z.number().int().nonnegative(),
    shrubs: z.number().int().nonnegative(),
    rocks: z.number().int().nonnegative(),
    maxSlope: z.number().positive(),
    /** Trees gather into forests: noise feature size (m) and the share of land that is forest (0–1). */
    forest: z.strictObject({ scale: z.number().positive(), cover: Unit }),
    /** Species mix (weights) per zone; kinds must be in TREE_KINDS. */
    species: z.strictObject({ lowland: z.array(SpeciesSchema).min(1), highland: z.array(SpeciesSchema).min(1), coast: z.array(SpeciesSchema).min(1) }),
    /** Crown colours per kind (several = variation). */
    leaves: z.record(z.string(), z.array(z.string().regex(/^#[0-9a-f]{6}$/i)).min(1)),
  }),
  village: z.strictObject({
    lotSpacing: z.number().positive(),
    lotsPerRow: z.number().int().positive(),
    offsetFromRail: z.number().positive(),
    /** Fruit trees / bamboo planted around each house (kinds from the lowland or highland species list). */
    gardenTrees: z.number().int().nonnegative(),
  }),
  people: z.strictObject({
    count: z.number().int().nonnegative(),
    walkSpeed: z.number().positive(),
    /** Villagers stop and talk when you come this close (m). */
    talkRadius: z.number().positive(),
    /**
     * What a villager says about the nearest concept plot, by its real state ({concept} = concept name).
     * Keys follow PlotHealth: weeds (memory decayed), growing, lit (mastered), seed (no data yet), locked, planned.
     */
    chatter: z.strictObject({ weeds: z.string().min(1), growing: z.string().min(1), lit: z.string().min(1), seed: z.string().min(1), locked: z.string().min(1), planned: z.string().min(1) }),
  }),
  /** You, walking the village (third-person). Speeds in m/s, distances in m. */
  player: z.strictObject({
    walkSpeed: z.number().positive(),
    runSpeed: z.number().positive(),
    swimSpeed: z.number().positive(),
    radius: z.number().positive(),
    /** How close you must be to a building / person to enter it. */
    interactRadius: z.number().positive(),
    /** Zoom limits of the follow camera (its starting offset is the walk view's eye/look, relative to you). */
    camera: z.strictObject({ minDistance: z.number().positive(), maxDistance: z.number().positive() }),
    /** A dog that trots after you (its model: assets.yaml cast.companion); `follow` = distance it keeps (m). */
    companion: z.strictObject({ name: z.string().min(1), follow: z.number().positive() }),
  }),
  /** A road running beside the whole rail line (bridges where it crosses water), with a bus and one stop per region. */
  road: z.strictObject({
    width: z.number().positive(),
    /** Distance from the rail centre line (m), on the side away from the station platforms. */
    offset: z.number().positive(),
    busSpeed: z.number().positive(),
    /** Seconds the bus waits at each stop. */
    busDwell: z.number().nonnegative(),
    busColor: z.string(),
  }),
  /** Per-region civic buildings; {region} = region title. The school opens that region's track roadmap. */
  civic: z.strictObject({
    school: z.string().min(1),
    schoolNote: z.string().min(1),
    busStop: z.string().min(1),
    busNote: z.string().min(1),
    /** Children playing in each schoolyard. */
    kids: z.number().int().nonnegative(),
  }),
  wildlife: z.strictObject({
    /** Flocks of chickens around houses, birds per flock, and how close you can get before they scatter (m). */
    chickenFlocks: z.number().int().nonnegative(),
    flockSize: z.number().int().positive(),
    fleeRadius: z.number().positive(),
    /** Butterflies fluttering around you by day. */
    butterflies: z.number().int().nonnegative(),
    butterflyColors: z.array(z.string()).min(1),
  }),
})
export type WorldMap = z.infer<typeof MapSchema>

/** A landmark hosts one site feature (simulator, lab, case or scenario) as a building in the village. */
export const LandmarkSchema = z.strictObject({
  id: IdSchema,
  model: z.string().min(1),
  ref: z.strictObject({ kind: z.enum(['simulator', 'lab', 'case', 'scenario']), id: IdSchema }),
  title: z.string().min(1),
  /** Why this building stands for that idea — the spatial hook for memory. */
  metaphor: z.string().min(1),
})
export type Landmark = z.infer<typeof LandmarkSchema>

export const GuideSchema = z.strictObject({
  id: IdSchema,
  name: z.string().min(1),
  role: z.string().min(1),
  landmark: IdSchema,
  tutorMode: IdSchema,
  greeting: z.string().min(1),
})
export type Guide = z.infer<typeof GuideSchema>

export const LandmarksFileSchema = z.strictObject({ landmarks: z.array(LandmarkSchema).min(1), guides: z.array(GuideSchema) })

export const ViewAnchorSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('train') }),
  z.strictObject({ kind: z.literal('overview') }),
  z.strictObject({ kind: z.literal('feature'), id: IdSchema }),
  z.strictObject({ kind: z.literal('lake'), id: IdSchema }),
  z.strictObject({ kind: z.literal('peak'), id: IdSchema }),
  z.strictObject({ kind: z.literal('landmark'), id: IdSchema }),
  /** Where you are in your learning: the first station that still has unfinished concepts. */
  z.strictObject({ kind: z.literal('frontier') }),
])
export type ViewAnchor = z.infer<typeof ViewAnchorSchema>

export const ViewSchema = z.strictObject({
  id: IdSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  /** focus: the timer view; review: due cards become fish; explore: free camera; walk: you walk the village. */
  mode: z.enum(['focus', 'review', 'explore', 'walk']),
  anchor: ViewAnchorSchema,
  /** Camera position relative to the anchor and the point it looks at (relative too). */
  eye: Vec3Schema,
  look: Vec3Schema,
  weather: IdSchema.optional(),
  time: z.enum(['auto', 'dawn', 'day', 'dusk', 'night']).default('auto'),
  ambience: z.array(z.string().min(1)).default([]),
})
export type WorldView = z.infer<typeof ViewSchema>
export const ViewsFileSchema = z.strictObject({ defaultView: IdSchema, views: z.array(ViewSchema).min(1) })

export const WeatherSchema = z.strictObject({
  id: IdSchema,
  /** Short symbol on the weather switcher. */
  icon: z.string().min(1),
  label: z.string().min(1),
  rain: Unit,
  snow: Unit,
  clouds: Unit,
  fog: Unit,
  wind: Unit,
  /** Expected lightning strikes per minute. */
  lightning: z.number().nonnegative(),
  rainbow: z.boolean(),
  ambience: z.array(z.string().min(1)).default([]),
})
export type Weather = z.infer<typeof WeatherSchema>
export const WeatherFileSchema = z.strictObject({
  defaultWeather: IdSchema,
  /** Shown when a focus journey reaches its last station. */
  celebration: IdSchema,
  /** Used while you stand at a scenario landmark (a crisis plays out in a storm). */
  scenario: IdSchema,
  presets: z.array(WeatherSchema).min(1),
})

export const MusicPieceSchema = z.strictObject({
  id: IdSchema,
  title: z.string().min(1),
  mood: z.string().min(1),
  bpm: z.number().min(30).max(160),
  /** MIDI note of the tonic. */
  root: z.number().int().min(24).max(84),
  /** Scale as semitone offsets from the root. */
  scale: z.array(z.number().int().min(0).max(11)).min(5),
  /** Chord roots as scale degrees (0-based), one per bar. */
  progression: z.array(z.number().int().nonnegative()).min(1),
  layers: z.array(z.string().min(1)).min(1),
  /** Probability a melody step plays a note. */
  density: Unit,
})
export type MusicPiece = z.infer<typeof MusicPieceSchema>
export const MusicFileSchema = z.strictObject({ note: z.string().min(1), pieces: z.array(MusicPieceSchema).min(1) })

export const JourneySchema = z.strictObject({
  id: IdSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  segments: z.number().int().min(1).max(12),
  focusMinutes: z.number().positive().max(180),
  breakMinutes: z.number().nonnegative().max(60),
  view: IdSchema,
})
export type Journey = z.infer<typeof JourneySchema>

export const FocusConfigSchema = z.strictObject({
  /** Seconds the tab may be hidden before the sapling withers. */
  graceSeconds: z.number().int().nonnegative(),
  /** Focus shorter than this (completed or not) is not planted. */
  minPlantMinutes: z.number().nonnegative(),
  dailyGoalMinutes: z.number().positive(),
  /** Today blocks whose items are assigned to segments, in order. */
  taskSources: z.array(z.enum(['reviews', 'lesson', 'practice', 'interleave', 'case', 'explain'])).min(1),
  journeys: z.array(JourneySchema).min(1),
  copy: z.strictObject({
    withered: z.string().min(1), planted: z.string().min(1), leaveWarning: z.string().min(1), journeyDone: z.string().min(1), breakOver: z.string().min(1),
  }),
})
export type FocusConfig = z.infer<typeof FocusConfigSchema>

export interface WorldBundle {
  map: WorldMap
  graphics: Graphics
  assets: AssetsFile
  landmarks: Landmark[]
  guides: Guide[]
  views: WorldView[]
  defaultView: string
  weather: z.infer<typeof WeatherFileSchema>
  music: z.infer<typeof MusicFileSchema>
}

