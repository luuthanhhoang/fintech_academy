'use client'

import type { Catalog } from '@/lib/content/catalog'
import { taskFor } from '@/lib/focus/tasks'
import { useToday } from '@/components/today/use-today'
import { Button } from '@/components/ui/primitives'
import { Panel } from './panel'
import { WorldLink } from './world-link'

/** Today's loop as quests in the world: each block links to what to do, ticks when done (from real activity). */
export function QuestDock({ catalog, onJourney, journeyOpen }: { catalog: Catalog; onJourney: () => void; journeyOpen: boolean }) {
  const today = useToday(catalog)
  const blocks = catalog.config.today.blocks
  if (!today) return <Panel className="w-72"><p className="text-xs text-ink-3">Đang đọc tiến độ của bạn…</p></Panel>
  const done = blocks.filter((b) => today.completed.has(b.id)).length
  return (
    <Panel className="w-72">
      <header className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="font-serif text-base font-semibold">Nhiệm vụ hôm nay</h2>
        <span className="num text-xs text-ink-3">{done}/{blocks.length}</span>
      </header>
      <ul className="space-y-1">
        {blocks.map((b) => {
          const task = taskFor(b.id, today.plan, catalog, today.dueCount)
          const ok = today.completed.has(b.id)
          return (
            <li key={b.id}>
              <WorldLink href={task?.href ?? '/today/'} label={task?.label ?? b.title} className="flex items-start gap-2 rounded-md px-1.5 py-1 hover:bg-paper-2">
                <span aria-hidden="true" className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border text-[10px] ${ok ? 'border-good bg-good text-paper' : 'border-rule text-transparent'}`}>
                  ✓
                </span>
                <span className="min-w-0">
                  <span className={`block text-sm leading-tight ${ok ? 'text-ink-3 line-through' : 'text-ink'}`}>{b.title}</span>
                  {task && !ok && <span className="block truncate text-[11px] text-ink-3">{task.label}</span>}
                </span>
              </WorldLink>
            </li>
          )
        })}
      </ul>
      <div className="mt-3 flex items-center gap-2">
        {!journeyOpen && (
          <Button variant="primary" onClick={onJourney} className="flex-1">
            🚆 Học theo chặng
          </Button>
        )}
        <WorldLink href="/today/" label="Hôm nay" className="text-xs text-accent underline">
          Xem đầy đủ
        </WorldLink>
      </div>
    </Panel>
  )
}
