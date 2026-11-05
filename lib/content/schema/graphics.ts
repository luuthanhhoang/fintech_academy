/** Art direction and quality presets for the 3D village: looks per time of day, vegetation palette, credits. */
import { z } from 'zod'
import { IdSchema } from './common'

const Hex = z.string().regex(/^#[0-9a-f]{6}$/i, 'màu phải dạng #rrggbb')
const Unit = z.number().min(0).max(1)

export const QualityPresetSchema = z.strictObject({
  id: IdSchema,
  label: z.string().min(1),
  dpr: z.tuple([z.number().positive(), z.number().positive()]),
  shadowMapSize: z.number().int().min(512).max(8192),
  grass: z.number().int().nonnegative(),
  flowers: z.number().int().nonnegative(),
  /** Screen-space ambient occlusion, bloom, depth of field in close views. */
  ao: z.boolean(),
  bloom: z.boolean(),
  dof: z.boolean(),
  clouds: z.number().int().nonnegative(),
  /** Fraction of scattered trees/shrubs to render. */
  vegetation: Unit,
})
export type QualityPreset = z.infer<typeof QualityPresetSchema>

/** A colour grade + lighting set used around one time of day; the renderer blends neighbours by sun elevation. */
export const LookSchema = z.strictObject({
  id: z.enum(['night', 'dawn', 'day', 'dusk']),
  /** Environment map key (lighting/reflections only; the sky is drawn by our own shader). */
  hdri: z.string().min(1),
  envIntensity: z.number().nonnegative(),
  exposure: z.number().positive(),
  sun: Hex,
  sunIntensity: z.number().nonnegative(),
  zenith: Hex,
  horizon: Hex,
  ground: Hex,
  fog: Hex,
  saturation: z.number().min(-1).max(1),
  contrast: z.number().min(-1).max(1),
})
export type Look = z.infer<typeof LookSchema>

export const GraphicsSchema = z.strictObject({
  defaultQuality: IdSchema,
  /** Narrow screens or few CPU cores start on this preset. */
  lightQuality: IdSchema,
  quality: z.array(QualityPresetSchema).min(1),
  looks: z.array(LookSchema).length(4),
  grass: z.strictObject({ base: Hex, tip: Hex, dry: Hex, height: z.number().positive(), patchRadius: z.number().positive() }),
  flowers: z.array(Hex).min(1),
  water: z.strictObject({ shallow: Hex, deep: Hex, foam: Hex, clarity: z.number().positive() }),
  credits: z.array(z.strictObject({ what: z.string().min(1), author: z.string().min(1), license: z.string().min(1), url: z.url() })).min(1),
})
export type Graphics = z.infer<typeof GraphicsSchema>
