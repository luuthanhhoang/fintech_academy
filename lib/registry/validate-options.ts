/** The registry keys the content validator checks references against (shared by the CLI script and tests). */
import type { ValidateOptions } from '../content/validate'
import {
  AMBIENCE_KEYS, ICON_KEYS, MUSIC_LAYER_KEYS, PROVIDER_KINDS, SHORTCUT_ACTIONS, SIMULATOR_KEYS, SIMULATOR_PARAMS, WORLD_MODEL_KEYS,
} from './keys'

export const VALIDATE_OPTIONS: ValidateOptions = {
  simulatorKeys: SIMULATOR_KEYS,
  simulatorParams: SIMULATOR_PARAMS,
  iconKeys: ICON_KEYS,
  shortcutActions: SHORTCUT_ACTIONS,
  providerKinds: PROVIDER_KINDS,
  worldModelKeys: WORLD_MODEL_KEYS,
  ambienceKeys: AMBIENCE_KEYS,
  musicLayerKeys: MUSIC_LAYER_KEYS,
}
