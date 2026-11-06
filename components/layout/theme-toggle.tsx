'use client'

import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(subscribe, () => true, () => false)
  const dark = mounted && resolvedTheme === 'dark'
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      className="flex w-full items-center justify-between gap-2 text-sm text-ink-2 hover:text-ink"
      role="switch"
      aria-checked={dark}
      aria-label="Nền tối"
    >
      <span>Nền tối</span>
      <span aria-hidden="true" className={`relative h-5 w-9 rounded-full transition-colors ${dark ? 'bg-accent' : 'bg-rule'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-card shadow transition-[left] ${dark ? 'left-[1.1rem]' : 'left-0.5'}`} />
      </span>
    </button>
  )
}
