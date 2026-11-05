import type { ProviderKind } from '../registry/keys'
import type { ProviderFactory } from './provider'
import { anthropicProvider } from './providers/anthropic'
import { openAICompatibleProvider } from './providers/openai-compatible'

/** Provider kind (as referenced by content/config/tutor.yaml) → factory. Typed to cover every kind. */
export const PROVIDERS: Record<ProviderKind, ProviderFactory> = {
  anthropic: anthropicProvider,
  'openai-compatible': openAICompatibleProvider,
}
