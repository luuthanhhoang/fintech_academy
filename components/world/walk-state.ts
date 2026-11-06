/**
 * Mutable state shared between the walking avatar (inside the canvas) and the HUD (keyboard, joystick, minimap).
 * Plain objects so the HUD bundle does not pull in three.js; read and written every frame without React renders.
 */
export const walkInput = {
  /** Keyboard / joystick direction relative to the camera: x = right, z = forward, each −1..1. */
  x: 0,
  z: 0,
  run: false,
  /** Click-to-move destination in world x/z, cleared on arrival or when keys are used. */
  target: null as [number, number] | null,
  /** Request to jump straight to a world x/z (bus, station, minimap), facing `face` if given; consumed by the avatar. */
  teleport: null as { at: [number, number]; face?: [number, number] } | null,
}

/** Set by the avatar: true when (x, z) is inside a building or trunk (the follow camera uses it to avoid occlusion). */
export const walkWorld = { blocked: null as ((x: number, z: number) => boolean) | null }

export const playerPose = { x: 0, y: 0, z: 0, yaw: 0, speed: 0, swimming: false, active: false }

const KEYS: Record<string, [number, number]> = {
  KeyW: [0, 1], ArrowUp: [0, 1], KeyS: [0, -1], ArrowDown: [0, -1], KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0],
}

const typing = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))

/** Keyboard walking (WASD / arrows, Shift to run). Returns a cleanup function. */
export function bindWalkKeys(): () => void {
  const down = new Set<string>()
  const sync = () => {
    let x = 0
    let z = 0
    for (const k of down) {
      const d = KEYS[k]
      if (d) {
        x += d[0]
        z += d[1]
      }
    }
    walkInput.x = Math.max(-1, Math.min(1, x))
    walkInput.z = Math.max(-1, Math.min(1, z))
    if (x || z) walkInput.target = null
  }
  const onDown = (e: KeyboardEvent) => {
    if (typing(e.target) || e.metaKey || e.ctrlKey || e.altKey) return
    if (e.key === 'Shift') walkInput.run = true
    if (!KEYS[e.code]) return
    e.preventDefault()
    down.add(e.code)
    sync()
  }
  const onUp = (e: KeyboardEvent) => {
    if (e.key === 'Shift') walkInput.run = false
    down.delete(e.code)
    sync()
  }
  const clear = () => {
    down.clear()
    walkInput.run = false
    sync()
  }
  window.addEventListener('keydown', onDown)
  window.addEventListener('keyup', onUp)
  window.addEventListener('blur', clear)
  return () => {
    window.removeEventListener('keydown', onDown)
    window.removeEventListener('keyup', onUp)
    window.removeEventListener('blur', clear)
    clear()
  }
}
