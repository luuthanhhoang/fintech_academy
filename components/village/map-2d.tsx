'use client'

import type { KeyboardEvent } from 'react'
import type { WorldLayout } from '@/lib/world/layout'
import type { Terrain } from '@/lib/world/terrain'
import { selectionId, type HealthMap, type SelectionId } from '@/components/world/scene-types'

const path = (pts: readonly (readonly [number, number])[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')

function Hit({ id, label, onSelect, children }: { id: SelectionId; label: string; onSelect: (id: SelectionId) => void; children: React.ReactNode }) {
  const key = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(id)
    }
  }
  return (
    <g role="button" tabIndex={0} aria-label={label} onClick={() => onSelect(id)} onKeyDown={key} className="cursor-pointer focus:outline-none [&:focus>*]:stroke-[var(--accent)]">
      <title>{label}</title>
      {children}
    </g>
  )
}

/** Top-down map of the same layout: the fallback without WebGL and an accessible, keyboard-navigable view. */
export function Map2D({ terrain, layout, health, names, onSelect }: { terrain: Terrain; layout: WorldLayout; health: HealthMap; names: ReadonlyMap<string, string>; onSelect: (id: SelectionId) => void }) {
  const m = terrain.map
  const h = m.size / 2
  const coast: [number, number][] = Array.from({ length: 61 }, (_, i) => {
    const x = -h + (i / 60) * m.size
    return [x, terrain.coastZ(x)]
  })
  return (
    <svg viewBox={`${-h} ${-h} ${m.size} ${m.size}`} className="h-full w-full bg-[#9fb27a] dark:bg-[#3e4a32]" role="group" aria-label={`Bản đồ ${m.title}`}>
      {m.regions.map((r) => (
        <circle key={r.id} cx={r.center[0]} cy={r.center[1]} r={r.radius} fill={r.palette.ground} opacity={0.55} />
      ))}
      {m.peaks.map((p) => (
        <g key={p.id}>
          <path d={`M${p.at[0] - 40} ${p.at[1] + 30} L${p.at[0]} ${p.at[1] - 40} L${p.at[0] + 40} ${p.at[1] + 30} Z`} fill="#8d8a82" />
          <path d={`M${p.at[0] - 14} ${p.at[1] - 12} L${p.at[0]} ${p.at[1] - 40} L${p.at[0] + 14} ${p.at[1] - 12} Z`} fill="#f2f2f2" />
          <text x={p.at[0]} y={p.at[1] + 48} textAnchor="middle" fontSize={16} fill="#2b2b2b">{p.name}</text>
        </g>
      ))}
      <path d={`${path(coast)} L${h} ${h} L${-h} ${h} Z`} fill="#3f7f9a" />
      {terrain.rivers.map((r) => (
        <path key={r.id} d={path(r.line.points)} stroke="#4f8fa6" strokeWidth={r.width} fill="none" strokeLinecap="round" />
      ))}
      {terrain.lakes.map((l) => (
        <Hit key={l.id} id={selectionId('lake', l.id)} label={l.name} onSelect={onSelect}>
          <circle cx={l.center[0]} cy={l.center[1]} r={l.radius} fill="#4f8fa6" stroke="#2b5a6a" strokeWidth={2} />
        </Hit>
      ))}
      <path d={path(terrain.rail.points)} stroke="#4a4038" strokeWidth={4} fill="none" strokeDasharray="10 6" />
      {layout.lots.map((l) => {
        const hp = health.get(l.conceptId)
        const fill = hp?.weeds ? '#c7b25a' : hp && hp.growth > 0.1 ? `rgb(${Math.round(120 - hp.growth * 60)},${Math.round(150 + hp.growth * 60)},70)` : '#8a7a5a'
        return (
          <Hit key={l.conceptId} id={selectionId('lot', l.conceptId)} label={`Khái niệm: ${names.get(l.conceptId) ?? l.conceptId}`} onSelect={onSelect}>
            <rect x={l.plot[0] - 5} y={l.plot[2] - 4} width={10} height={8} fill={fill} stroke="#3a3328" strokeWidth={0.8} />
            <rect x={l.house[0] - 3} y={l.house[2] - 3} width={6} height={6} fill={hp?.lit ? '#ffd36b' : '#d9cba8'} stroke="#3a3328" strokeWidth={0.8} />
          </Hit>
        )
      })}
      {layout.landmarks.map((l) => (
        <Hit key={l.landmark.id} id={selectionId('landmark', l.landmark.id)} label={l.landmark.title} onSelect={onSelect}>
          <rect x={l.position[0] - 8} y={l.position[2] - 8} width={16} height={16} transform={`rotate(45 ${l.position[0]} ${l.position[2]})`} fill="#1d6a73" stroke="#fff" strokeWidth={2} />
        </Hit>
      ))}
      {layout.features.map((f) => (
        <Hit key={f.id} id={selectionId('feature', f.id)} label={f.name} onSelect={onSelect}>
          <circle cx={f.position[0]} cy={f.position[2]} r={8} fill="#e0703a" stroke="#fff" strokeWidth={2} />
        </Hit>
      ))}
      {layout.guides.map((g) => (
        <Hit key={g.guide.id} id={selectionId('guide', g.guide.id)} label={`${g.guide.name} — ${g.guide.role}`} onSelect={onSelect}>
          <circle cx={g.position[0]} cy={g.position[2]} r={6} fill="#ffd36b" stroke="#2b2b2b" strokeWidth={1.5} />
        </Hit>
      ))}
      {layout.stations.map((s) => (
        <Hit key={s.id} id={selectionId('station', s.id)} label={`Ga ${s.id.toUpperCase()} · ${s.title}`} onSelect={onSelect}>
          <circle cx={s.position[0]} cy={s.position[2]} r={9} fill="#fbfaf6" stroke="#1d1c1a" strokeWidth={3} />
          <text x={s.position[0] + 13} y={s.position[2] - 10} fontSize={15} fill="#1d1c1a" stroke="#fbfaf6" strokeWidth={3} paintOrder="stroke">
            {s.id.toUpperCase()} {s.title}
          </text>
        </Hit>
      ))}
    </svg>
  )
}

const LEGEND: { swatch: React.ReactNode; label: string }[] = [
  { swatch: <rect x={2} y={4} width={12} height={8} fill="#5fc046" stroke="#3a3328" />, label: 'Ruộng: xanh = nhớ tốt, vàng úa = cần ôn, nâu = chưa học' },
  { swatch: <rect x={4} y={4} width={8} height={8} fill="#ffd36b" stroke="#3a3328" />, label: 'Nhà sáng đèn = khái niệm đã thành thạo' },
  { swatch: <rect x={4} y={4} width={8} height={8} transform="rotate(45 8 8)" fill="#1d6a73" />, label: 'Công trình: mô phỏng, lab, case, tình huống' },
  { swatch: <circle cx={8} cy={8} r={5} fill="#ffd36b" stroke="#2b2b2b" />, label: 'Người dẫn đường (gia sư AI)' },
  { swatch: <circle cx={8} cy={8} r={5} fill="#fbfaf6" stroke="#1d1c1a" strokeWidth={2} />, label: 'Ga tàu = một chặng lộ trình' },
]

export function MapLegend() {
  return (
    <ul className="space-y-1 text-[11px] text-ink-2">
      {LEGEND.map((l) => (
        <li key={l.label} className="flex items-center gap-2">
          <svg width={16} height={16} aria-hidden="true">{l.swatch}</svg>
          {l.label}
        </li>
      ))}
    </ul>
  )
}
