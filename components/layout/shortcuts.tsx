'use client'

import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useMemo } from 'react'
import type { Shortcut } from '@/lib/content/schema/config'
import type { ShortcutAction } from '@/lib/registry/keys'
import { isTypingTarget, parseKeys, sequenceMatches, type KeyEventLike } from '@/lib/shortcuts/match'

export interface ShortcutHandlers {
  openSearch: () => void
  showHelp: () => void
}

/** Binds shortcuts declared in content/config/shortcuts.yaml to action handlers (registry, not if/else on keys). */
export function useShortcuts(shortcuts: readonly Shortcut[], handlers: ShortcutHandlers) {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const parsed = useMemo(() => shortcuts.map((s) => ({ s, seq: parseKeys(s.keys) })), [shortcuts])

  useEffect(() => {
    const actions: Record<ShortcutAction, (s: Shortcut) => void> = {
      'open-search': () => handlers.openSearch(),
      'show-help': () => handlers.showHelp(),
      'toggle-theme': () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'),
      go: (s) => s.href && router.push(s.href),
    }
    let history: KeyEventLike[] = []
    let lastAt = 0
    const onKey = (e: KeyboardEvent) => {
      const withMod = e.metaKey || e.ctrlKey
      if (!withMod && isTypingTarget(e.target)) return
      if (['Shift', 'Meta', 'Control', 'Alt'].includes(e.key)) return
      const now = Date.now()
      if (now - lastAt > 1200) history = []
      lastAt = now
      history = [...history.slice(-3), { key: e.key, metaKey: e.metaKey, ctrlKey: e.ctrlKey, altKey: e.altKey }]
      const hit = parsed.find((p) => sequenceMatches(p.seq, history))
      if (!hit) return
      e.preventDefault()
      history = []
      actions[hit.s.action as ShortcutAction]?.(hit.s)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [parsed, handlers, router, resolvedTheme, setTheme])
}
