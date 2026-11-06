'use client'

import { useSyncExternalStore } from 'react'
import type { Shortcut } from '@/lib/content/schema/config'
import { formatKeys } from '@/lib/shortcuts/match'
import { Kbd } from '@/components/ui/primitives'
import { Dialog } from './dialog'

const subscribe = () => () => {}
const isMacNow = () => /Mac|iPhone|iPad/.test(navigator.platform)

export function HelpDialog({ shortcuts, open, onClose }: { shortcuts: readonly Shortcut[]; open: boolean; onClose: () => void }) {
  const isMac = useSyncExternalStore(subscribe, isMacNow, () => false)
  return (
    <Dialog open={open} onClose={onClose} label="Phím tắt">
      <div className="p-5">
        <h2 className="font-display text-xl font-semibold">Phím tắt (Keyboard shortcuts)</h2>
        <ul className="mt-4 divide-y divide-rule">
          {shortcuts.map((s) => (
            <li key={s.keys} className="flex items-center justify-between gap-4 py-2 text-sm">
              <span>{s.description}</span>
              <span className="flex gap-1">
                {formatKeys(s.keys, isMac).map((k, i) => (
                  <Kbd key={i}>{k}</Kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Dialog>
  )
}
