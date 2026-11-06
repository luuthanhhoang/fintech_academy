'use client'

import { useEffect, useRef, useState, type PointerEvent } from 'react'
import type { Reachable } from '@/lib/world/walk'
import { walkInput } from '@/components/world/walk-state'

const VERB: Record<Reachable['kind'], string> = {
  lot: 'Vào nhà học', station: 'Xem ga', landmark: 'Vào', guide: 'Trò chuyện với', feature: 'Ngắm', school: 'Vào', bus: 'Bắt xe ở',
}

/** "E — Vào nhà học …": appears when you stand next to something you can enter. */
export function InteractPrompt({ near, onEnter }: { near: Reachable; onEnter: () => void }) {
  return (
    <button
      type="button"
      onClick={onEnter}
      className="pointer-events-auto flex items-center gap-2 rounded-full border border-lantern/60 bg-paper/95 py-1.5 pl-1.5 pr-4 font-sans text-sm shadow-xl backdrop-blur motion-safe:animate-[reader-in_.2s_ease-out]"
    >
      <kbd className="grid h-7 w-7 place-items-center rounded-full bg-lantern font-semibold text-paper max-sm:hidden">E</kbd>
      <span>
        {VERB[near.kind]} <strong>{near.label}</strong>
      </span>
    </button>
  )
}

const RADIUS = 46

/** Touch joystick (bottom-left) and a run toggle; writes the same walk input as the keyboard. */
export function Joystick() {
  const [knob, setKnob] = useState<[number, number]>([0, 0])
  const [run, setRun] = useState(false)
  const origin = useRef<[number, number] | null>(null)
  useEffect(() => () => void Object.assign(walkInput, { x: 0, z: 0, run: false }), [])
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (!origin.current) return
    let dx = e.clientX - origin.current[0]
    let dy = e.clientY - origin.current[1]
    const d = Math.hypot(dx, dy)
    if (d > RADIUS) {
      dx = (dx / d) * RADIUS
      dy = (dy / d) * RADIUS
    }
    setKnob([dx, dy])
    walkInput.x = dx / RADIUS
    walkInput.z = -dy / RADIUS
    walkInput.target = null
  }
  const end = () => {
    origin.current = null
    setKnob([0, 0])
    walkInput.x = 0
    walkInput.z = 0
  }
  return (
    <div className="pointer-events-auto flex items-end gap-3">
      <div
        role="application"
        aria-label="Cần điều khiển: kéo để đi"
        className="relative h-28 w-28 touch-none rounded-full border border-rule bg-paper/50 backdrop-blur"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          const r = e.currentTarget.getBoundingClientRect()
          origin.current = [r.left + r.width / 2, r.top + r.height / 2]
          move(e)
        }}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      >
        <span className="absolute left-1/2 top-1/2 h-12 w-12 rounded-full bg-paper shadow-lg" style={{ transform: `translate(calc(-50% + ${knob[0]}px), calc(-50% + ${knob[1]}px))` }} />
      </div>
      <button
        type="button"
        aria-pressed={run}
        onClick={() => setRun((r) => ((walkInput.run = !r), !r))}
        className={`mb-1 rounded-full border px-3 py-2 font-sans text-xs shadow ${run ? 'border-accent bg-accent text-paper' : 'border-rule bg-paper/80'}`}
      >
        🏃 Chạy
      </button>
    </div>
  )
}

/** Short help for walking, shown until you first move. */
export function WalkHint() {
  return (
    <p className="pointer-events-none rounded-full bg-paper/85 px-3 py-1 text-center font-sans text-[11px] text-ink-2 shadow backdrop-blur max-sm:hidden">
      <kbd>W A S D</kbd> / phím mũi tên để đi · <kbd>Shift</kbd> chạy · bấm lên mặt đất để tới đó · kéo chuột xoay góc nhìn · <kbd>E</kbd> vào nhà
    </p>
  )
}
