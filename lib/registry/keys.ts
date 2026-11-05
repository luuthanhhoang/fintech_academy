/**
 * Component keys that content may reference. Typed registries (simulators.tsx) must implement every key,
 * and the content validator rejects simulator metadata whose componentKey is not listed here.
 */
export const SIMULATOR_KEYS = ['tvm', 'inflation', 'bond', 'orderbook', 'options', 'portfolio', 'dcf'] as const
export type SimulatorKey = (typeof SIMULATOR_KEYS)[number]

/** Parameter keys each simulator body reads; the validator requires the YAML to declare exactly these. */
export const SIMULATOR_PARAMS: Record<SimulatorKey, readonly string[]> = {
  tvm: ['principal', 'ratePct', 'years', 'compoundsPerYear', 'contribution'],
  inflation: ['amount', 'nominalPct', 'inflationPct', 'years'],
  bond: ['face', 'couponPct', 'ytmPct', 'years', 'freq'],
  orderbook: ['mid', 'spreadTicks', 'tick', 'levels', 'baseQty', 'seed', 'orderQty'],
  options: ['strike1', 'premium1', 'strike2', 'premium2', 'qty'],
  portfolio: ['rho', 'periods', 'seed', 'riskFreePct'],
  dcf: ['baseFcf', 'growthPct', 'years', 'discountPct', 'terminalGrowthPct', 'netDebt', 'shares'],
}

export function isSimulatorKey(key: string): key is SimulatorKey {
  return (SIMULATOR_KEYS as readonly string[]).includes(key)
}

/** Icon names that content (e.g. nav in site.yaml) may reference. */
export const ICON_KEYS = ['sun', 'map', 'cards', 'chart', 'code', 'alert', 'spark', 'pulse', 'gear', 'info', 'shuffle', 'route', 'book', 'tree'] as const
export type IconKey = (typeof ICON_KEYS)[number]

/** Actions that shortcuts.yaml may bind. */
export const SHORTCUT_ACTIONS = ['open-search', 'show-help', 'toggle-theme', 'go'] as const
export type ShortcutAction = (typeof SHORTCUT_ACTIONS)[number]

/** Tutor provider kinds that tutor.yaml may reference (implemented in lib/tutor/registry.ts). */
export const PROVIDER_KINDS = ['anthropic', 'openai-compatible'] as const
export type ProviderKind = (typeof PROVIDER_KINDS)[number]

/** Learning-method ids that UI blocks link to ("vì sao cách này hiệu quả"); must exist in methods.yaml. */
export const LEARNING_METHOD_KEYS = ['retrieval-practice', 'spaced-repetition', 'pretesting', 'interleaving', 'worked-examples', 'dual-coding', 'self-explanation', 'scenario-practice', 'method-of-loci', 'timed-breaks'] as const
export type LearningMethodKey = (typeof LEARNING_METHOD_KEYS)[number]

/** Procedural building models a landmark may use (implemented in components/world/models). */
export const WORLD_MODEL_KEYS = ['bank', 'granary', 'communal-house', 'market', 'watchtower', 'orchard', 'watermill', 'archive', 'workshop', 'ruin', 'signal-tower'] as const
export type WorldModelKey = (typeof WORLD_MODEL_KEYS)[number]

/** Synthesised ambience loops that views and weather presets may request (lib/audio/ambience.ts). */
export const AMBIENCE_KEYS = ['rain', 'wind', 'waves', 'stream', 'birds', 'crickets', 'train'] as const
export type AmbienceKey = (typeof AMBIENCE_KEYS)[number]

/** Instrument layers a generative music piece may use (lib/audio/instruments.ts). */
export const MUSIC_LAYER_KEYS = ['pad', 'bell', 'bass', 'pluck'] as const
export type MusicLayerKey = (typeof MUSIC_LAYER_KEYS)[number]

export function isAmbienceKey(key: string): key is AmbienceKey {
  return (AMBIENCE_KEYS as readonly string[]).includes(key)
}

export function isMusicLayerKey(key: string): key is MusicLayerKey {
  return (MUSIC_LAYER_KEYS as readonly string[]).includes(key)
}

export function isWorldModelKey(key: string): key is WorldModelKey {
  return (WORLD_MODEL_KEYS as readonly string[]).includes(key)
}

/** Environment maps the graphics looks may reference (loaded lazily in components/world/hdri.ts). */
export const HDRI_KEYS = ['night', 'sunrise', 'park', 'sunset', 'dawn', 'sky', 'forest'] as const
export type HdriKey = (typeof HDRI_KEYS)[number]

export function isHdriKey(key: string): key is HdriKey {
  return (HDRI_KEYS as readonly string[]).includes(key)
}

/** Vegetation kinds the map may scatter (geometries in components/world/tree-geometry.ts). */
export const TREE_KINDS = ['broadleaf', 'pine', 'palm', 'bamboo', 'areca', 'banana', 'flowering', 'shrub', 'rock'] as const
export type TreeKind = (typeof TREE_KINDS)[number]

export function isTreeKind(key: string): key is TreeKind {
  return (TREE_KINDS as readonly string[]).includes(key)
}
