'use client'

import type { Weather } from '@/lib/content/schema/world'
import type { TimeOfDay } from '@/lib/world/sky'

/** Times of day you can pick (the sky is computed for that hour; "auto" follows your clock). */
export const TIMES: { value: TimeOfDay; icon: string; label: string }[] = [
  { value: 'auto', icon: '🕒', label: 'Theo giờ thật' },
  { value: 'dawn', icon: '🌅', label: 'Bình minh' },
  { value: 'day', icon: '☀️', label: 'Ban ngày' },
  { value: 'golden', icon: '🌇', label: 'Giờ vàng' },
  { value: 'dusk', icon: '🌆', label: 'Hoàng hôn' },
  { value: 'night', icon: '🌙', label: 'Ban đêm' },
]

function Chip({ on, icon, label, disabled, onClick }: { on: boolean; icon: string; label: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={on}
      title={label}
      className={`flex h-8 shrink-0 items-center gap-1 rounded-full px-2 text-sm transition-colors disabled:opacity-40 ${on ? 'bg-accent text-paper shadow-sm' : 'hover:bg-paper-2'}`}
    >
      <span aria-hidden="true">{icon}</span>
      <span className={`text-[11px] ${on ? '' : 'sr-only'}`}>{label}</span>
    </button>
  )
}

/** Always-visible switcher for time of day and weather (moods, not forecasts). */
export function SkyBar({ time, onTime, weather, weatherId, locked, onWeather }: { time: TimeOfDay; onTime: (t: TimeOfDay) => void; weather: Weather[]; weatherId: string; locked: boolean; onWeather: (id: string) => void }) {
  return (
    <div className="pointer-events-auto flex max-w-full flex-col gap-1 rounded-2xl border border-rule bg-paper/90 p-1 font-sans shadow-lg backdrop-blur">
      <div role="toolbar" aria-label="Thời điểm trong ngày" className="flex gap-0.5 overflow-x-auto">
        {TIMES.map((t) => <Chip key={t.value} on={time === t.value} icon={t.icon} label={t.label} onClick={() => onTime(t.value)} />)}
      </div>
      <div role="toolbar" aria-label={locked ? 'Thời tiết (góc này cố định)' : 'Thời tiết'} className="flex gap-0.5 overflow-x-auto border-t border-rule pt-1">
        {weather.map((w) => <Chip key={w.id} on={weatherId === w.id} icon={w.icon} label={w.label} disabled={locked} onClick={() => onWeather(w.id)} />)}
      </div>
    </div>
  )
}
