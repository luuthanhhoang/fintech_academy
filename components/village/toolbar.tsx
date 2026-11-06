'use client'

import type { WorldBundle } from '@/lib/content/schema/world'
import type { TimeOfDay } from '@/lib/world/sky'
import type { AudioPrefs } from './use-village-audio'
import { Panel, Select } from './panel'

const TIMES: { value: TimeOfDay; label: string }[] = [
  { value: 'golden', label: 'Giờ vàng' },
  { value: 'auto', label: 'Theo giờ thật' },
  { value: 'dawn', label: 'Bình minh' },
  { value: 'day', label: 'Ban ngày' },
  { value: 'dusk', label: 'Hoàng hôn' },
  { value: 'night', label: 'Ban đêm' },
]

export interface ToolbarProps {
  world: WorldBundle
  quality: string
  onQuality(id: string): void
  /** Weather is fixed by some views; the label says so. */
  weatherLocked: boolean
  weatherId: string
  time: TimeOfDay
  audio: AudioPrefs
  mode: '3d' | '2d'
  webgl: boolean
  skyNote: string
  onWeather(id: string): void
  onTime(t: TimeOfDay): void
  onToggleAudio(): void
  onAudio(patch: Partial<AudioPrefs>): void
  onMode(m: '3d' | '2d'): void
}

/** View, weather, time, music and sound controls. Weather and time are mood choices, not real forecasts. */
export function Toolbar(p: ToolbarProps) {
  return (
    <Panel className="w-full sm:w-72">
      <div className="grid grid-cols-2 gap-2">
        <Select
          label={p.weatherLocked ? 'Thời tiết (góc này cố định)' : 'Thời tiết'}
          value={p.weatherId}
          onChange={p.onWeather}
          options={p.world.weather.presets.map((w) => ({ value: w.id, label: w.label }))}
        />
        <Select label="Thời điểm" value={p.time} onChange={(v) => p.onTime(v as TimeOfDay)} options={TIMES} />
        <Select label="Đồ hoạ" value={p.quality} onChange={p.onQuality} options={p.world.graphics.quality.map((q) => ({ value: q.id, label: q.label }))} />
        <Select
          label="Nhạc"
          value={p.audio.pieceId ?? ''}
          onChange={(v) => p.onAudio({ pieceId: v || null })}
          options={[{ value: '', label: 'Không nhạc' }, ...p.world.music.pieces.map((m) => ({ value: m.id, label: `${m.title} · ${m.mood}` }))]}
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={p.onToggleAudio} aria-pressed={p.audio.on} className={`rounded-md border px-2 py-1 text-xs ${p.audio.on ? 'border-accent bg-accent-soft text-accent' : 'border-rule'}`}>
          {p.audio.on ? '🔊 Âm thanh bật' : '🔈 Bật âm thanh'}
        </button>
        {p.audio.on && (
          <label className="flex items-center gap-1 text-[11px] text-ink-3">
            Âm lượng
            <input type="range" min={0} max={1} step={0.05} value={p.audio.master} onChange={(e) => p.onAudio({ master: Number(e.target.value) })} className="w-20" />
          </label>
        )}
        <button type="button" onClick={() => p.onMode(p.mode === '3d' ? '2d' : '3d')} disabled={!p.webgl && p.mode === '2d'} className="rounded-md border border-rule px-2 py-1 text-xs disabled:opacity-50">
          {p.mode === '3d' ? 'Bản đồ 2D' : 'Xem 3D'}
        </button>
      </div>
      <p className="mt-2 text-[11px] leading-snug text-ink-3">{p.skyNote}</p>
      <p className="mt-1 text-[11px] leading-snug text-ink-3">{p.world.music.note}</p>
      <details className="mt-1 text-[11px] text-ink-3">
        <summary className="cursor-pointer">Nguồn tài nguyên đồ hoạ</summary>
        <ul className="mt-1 space-y-0.5">
          {p.world.graphics.credits.map((c) => (
            <li key={c.url}>
              {c.what} — {c.author} ({c.license}){' '}
              <a href={c.url} target="_blank" rel="noreferrer" className="underline">
                nguồn
              </a>
            </li>
          ))}
        </ul>
      </details>
    </Panel>
  )
}
