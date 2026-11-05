'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo, useState } from 'react'
import type { Catalog } from '@/lib/content/catalog'
import type { ProviderKind } from '@/lib/registry/keys'
import { db } from '@/lib/db/dexie'
import { PROVIDERS } from '@/lib/tutor/registry'
import { getApiKey, onKeyChange, TutorSettingsSchema, type TutorSettings } from '@/lib/tutor/settings'
import type { LLMProvider } from '@/lib/tutor/provider'

export type TutorState =
  | { status: 'loading' }
  | { status: 'disabled'; settings: TutorSettings | null }
  | { status: 'needs-key'; settings: TutorSettings }
  | { status: 'ready'; settings: TutorSettings; provider: LLMProvider; model: string; providerLabel: string }

/** Live tutor settings (wrapped so "no row" is distinguishable from "still loading"). */
export function useTutorSettings(): { loaded: boolean; settings: TutorSettings | null } {
  const res = useLiveQuery(async () => ({ row: await db().settings.get('tutor') }), [])
  if (!res) return { loaded: false, settings: null }
  const parsed = TutorSettingsSchema.safeParse(res.row?.value)
  return { loaded: true, settings: parsed.success ? parsed.data : null }
}

/** Tutor availability. Everything else in the app works when this is "disabled". */
export function useTutor(catalog: Catalog | null): TutorState {
  const { loaded, settings } = useTutorSettings()
  const [key, setKey] = useState<{ storage: string; value: string | null } | null>(null)
  const storage = settings?.keyStorage

  useEffect(() => {
    if (!storage) return
    const read = () => void getApiKey(storage).then((value) => setKey({ storage, value }))
    read()
    return onKeyChange(read)
  }, [storage])

  const preset = catalog?.config.tutor.providers.find((p) => p.id === settings?.providerId)
  const apiKey = key && key.storage === storage ? key.value : undefined
  const provider = useMemo(() => {
    if (!preset || !apiKey) return null
    const factory = PROVIDERS[preset.kind as ProviderKind]
    return factory ? factory({ apiKey, baseURL: settings?.baseURL || preset.baseURL }) : null
  }, [preset, apiKey, settings?.baseURL])

  if (!loaded || !catalog) return { status: 'loading' }
  if (!settings?.enabled) return { status: 'disabled', settings }
  if (apiKey === undefined) return { status: 'loading' }
  if (!provider || !settings.model) return { status: 'needs-key', settings }
  return { status: 'ready', settings, provider, model: settings.model, providerLabel: preset?.label ?? settings.providerId }
}
