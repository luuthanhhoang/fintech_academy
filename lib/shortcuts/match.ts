/** Keyboard shortcut parsing/matching. "mod" = Cmd on macOS, Ctrl elsewhere; space separates a sequence. */

export interface KeyStroke {
  key: string
  mod: boolean
  shift: boolean
}

export function parseKeys(spec: string): KeyStroke[] {
  return spec.split(' ').map((part) => {
    const bits = part.split('+')
    const key = (bits.pop() ?? '').toLowerCase()
    return { key, mod: bits.includes('mod'), shift: bits.includes('shift') }
  })
}

export interface KeyEventLike {
  key: string
  metaKey: boolean
  ctrlKey: boolean
  altKey: boolean
}

export function strokeMatches(stroke: KeyStroke, e: KeyEventLike): boolean {
  const mod = e.metaKey || e.ctrlKey
  return e.key.toLowerCase() === stroke.key && mod === stroke.mod && !e.altKey
}

/** Matches the tail of a key history against a sequence. */
export function sequenceMatches(seq: readonly KeyStroke[], history: readonly KeyEventLike[]): boolean {
  if (history.length < seq.length) return false
  const tail = history.slice(history.length - seq.length)
  return seq.every((s, i) => strokeMatches(s, tail[i] as KeyEventLike))
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!target || typeof (target as HTMLElement).tagName !== 'string') return false
  const el = target as HTMLElement
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || !!el.closest?.('.cm-editor')
}

export function formatKeys(spec: string, isMac: boolean): string[] {
  return spec.split(' ').map((p) => p.replace('mod', isMac ? '⌘' : 'Ctrl').replace('+', ' + ').toUpperCase())
}
