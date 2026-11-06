/**
 * 3D model assets for the village (content/world/assets.yaml): which glTF files exist (public/models, CC0),
 * how big each really is, which animation clip plays for each action, and where each model is used.
 */
import { z } from 'zod'
import { IdSchema } from './common'

/** Actions an animated model can perform; each maps to a clip name inside its .glb. */
export const ACTIONS = ['idle', 'walk', 'run', 'sit', 'wave', 'eat'] as const
export type Action = (typeof ACTIONS)[number]

export const ModelSchema = z.strictObject({
  id: IdSchema,
  /** File name in public/models. */
  file: z.string().regex(/^[a-z0-9_-]+\.glb$/),
  /** The model is scaled so that this dimension (m) matches the real-world size. */
  size: z.strictObject({ axis: z.enum(['height', 'length']), metres: z.number().positive() }),
  /** Clip name per action (animated models only). `idle` and `walk` are required when present. */
  clips: z.partialRecord(z.enum(ACTIONS), z.string().min(1)).optional(),
  /** Material names recoloured with the scene palette (tree leaves, rock faces); the rest keep their colour. */
  paint: z.array(z.string().min(1)).default([]),
})
export type ModelAsset = z.infer<typeof ModelSchema>

const Ids = z.array(IdSchema).min(1)

export const AssetsFileSchema = z.strictObject({
  /** Where the files come from (shown under graphics credits). */
  credit: z.strictObject({ what: z.string().min(1), author: z.string().min(1), license: z.string().min(1), url: z.string().url(), notice: z.string().min(1) }),
  models: z.array(ModelSchema).min(1),
  cast: z.strictObject({
    player: IdSchema,
    villagers: Ids,
    kids: Ids,
    /** Children are the villager models scaled down by this factor. */
    kidScale: z.number().positive().max(1),
    guides: Ids,
    companion: IdSchema,
    /** Wild animals roaming forests: they graze, wander and bolt when you come close. */
    wildlife: z.array(z.strictObject({ model: IdSchema, count: z.number().int().nonnegative(), biome: z.enum(['lowland', 'highland']) })),
    bus: IdSchema,
    /** Cars and trucks driving the road. */
    traffic: Ids,
    trafficCount: z.number().int().nonnegative(),
    /** A tractor working the fields of paddy regions. */
    tractor: IdSchema,
    tractors: z.number().int().nonnegative(),
    /** Region whose concept houses are town buildings instead of village houses. */
    town: z.strictObject({ region: IdSchema, models: Ids }),
    /** Props: fences round each plot, goods stacked at stations, a camp beside a scenery feature. */
    fence: IdSchema,
    stationGoods: Ids,
    camp: z.strictObject({ feature: IdSchema, models: Ids }),
  }),
  /** Tree kinds (map.yaml species) drawn with models; kinds not listed keep their procedural shape. */
  vegetation: z.record(z.string(), Ids),
})
export type AssetsFile = z.infer<typeof AssetsFileSchema>
