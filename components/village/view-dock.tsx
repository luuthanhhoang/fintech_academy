'use client'

import type { WorldView } from '@/lib/content/schema/world'

/** Camera views as a dock at the bottom of the world: one tap to ride the train, sit in the rain, go fishing… */
export function ViewDock({ views, current, onPick }: { views: WorldView[]; current: string; onPick: (id: string) => void }) {
  const active = views.find((v) => v.id === current)
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 flex flex-col items-center gap-1.5 px-3">
      {active && <p className="pointer-events-none max-w-md rounded-full bg-paper/80 px-3 py-1 text-center font-sans text-[11px] text-ink-2 backdrop-blur">{active.description}</p>}
      <div role="toolbar" aria-label="Góc ngắm" className="pointer-events-auto flex max-w-full gap-1 overflow-x-auto rounded-full border border-rule bg-paper/90 p-1 shadow-lg backdrop-blur">
        {views.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => onPick(v.id)}
            aria-pressed={v.id === current}
            className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 font-sans text-xs transition-colors ${v.id === current ? 'bg-accent text-paper' : 'text-ink-2 hover:bg-paper-2'}`}
          >
            {v.title}
          </button>
        ))}
      </div>
    </div>
  )
}
