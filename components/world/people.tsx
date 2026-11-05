'use client'

import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type * as THREE from 'three'
import type { WorldMap } from '@/lib/content/schema/world'
import { mulberry32 } from '@/lib/finance/random'
import type { PlacedGuide, Pos } from '@/lib/world/layout'
import type { Terrain } from '@/lib/world/terrain'
import { Label } from './label-portal'
import { Person, pose, type Look } from './person'
import { selectionId, type SelectionId } from './scene-types'

function Walker({ terrain, points, look, seed, speed }: { terrain: Terrain; points: Pos[]; look: Look; seed: number; speed: number }) {
  const body = useRef<THREE.Group>(null)
  const joints = useRef<(THREE.Object3D | null)[]>([])
  const rand = useMemo(() => mulberry32(seed), [seed])
  const state = useRef({ from: points[seed % points.length]!, to: points[(seed * 7 + 3) % points.length]!, f: 0, wait: 0, phase: 0, yaw: 0 })
  useFrame(({ clock }, dt) => {
    const g = body.current
    const s = state.current
    if (!g) return
    const walking = s.wait <= 0
    if (!walking) s.wait -= dt
    else {
      const dist = Math.hypot(s.to[0] - s.from[0], s.to[2] - s.from[2]) || 1
      s.f += (speed * dt) / dist
      s.phase += dt * speed * 5.2
      if (s.f >= 1) {
        s.from = s.to
        s.to = points[Math.floor(rand() * points.length)]!
        s.f = 0
        s.wait = 2 + rand() * 7
      }
    }
    const ox = Math.sin(seed) * 6
    const oz = Math.cos(seed) * 6
    const x = s.from[0] + ox + (s.to[0] - s.from[0]) * s.f
    const z = s.from[2] + oz + (s.to[2] - s.from[2]) * s.f
    g.position.set(x, terrain.height(x, z), z)
    const target = Math.atan2(s.to[0] - s.from[0], s.to[2] - s.from[2])
    s.yaw += Math.atan2(Math.sin(target - s.yaw), Math.cos(target - s.yaw)) * Math.min(1, dt * 4)
    g.rotation.y = s.yaw
    pose(joints.current, s.phase, walking ? 1 : 0, clock.elapsedTime + seed)
  })
  return (
    <group ref={body}>
      <Person look={look} joints={joints} />
    </group>
  )
}

function makeLook(map: WorldMap, rand: () => number, lowland: boolean): Look {
  const p = map.people
  const at = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)]!
  return {
    skin: at(p.skin), cloth: at(p.clothes), pants: at(p.clothes), hair: at(p.hair),
    hat: lowland ? rand() < 0.6 : rand() < 0.2, long: rand() < 0.4, carry: lowland && rand() < 0.25, height: 1.55 + rand() * 0.25,
  }
}

/** Villagers walking between stations, houses and landmarks of their region. */
export function Villagers({ terrain, waypoints }: { terrain: Terrain; waypoints: Record<string, Pos[]> }) {
  const m = terrain.map
  const people = useMemo(() => {
    const rand = mulberry32(m.seed + 5)
    const regions = m.regions.filter((r) => (waypoints[r.id]?.length ?? 0) > 1)
    return Array.from({ length: regions.length ? m.people.count : 0 }, (_, i) => {
      const region = regions[i % regions.length]!
      return { id: i, points: waypoints[region.id]!, look: makeLook(m, rand, region.biome === 'lowland') }
    })
  }, [m, waypoints])
  return (
    <group>
      {people.map((p) => <Walker key={p.id} terrain={terrain} points={p.points} look={p.look} seed={p.id + 1} speed={m.people.walkSpeed} />)}
    </group>
  )
}

function Guide({ g, look, onSelect, labels }: { g: PlacedGuide; look: Look; onSelect: (id: SelectionId) => void; labels: boolean }) {
  const joints = useRef<(THREE.Object3D | null)[]>([])
  const marker = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    pose(joints.current, 0, 0, clock.elapsedTime)
    if (marker.current) {
      marker.current.position.y = 3.3 + Math.sin(clock.elapsedTime * 2) * 0.12
      marker.current.rotation.y = clock.elapsedTime
    }
  })
  return (
    <group
      position={g.position}
      rotation-y={g.rotation + Math.PI}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(selectionId('guide', g.guide.id))
      }}
    >
      <group scale={1.25}>
        <Person look={look} joints={joints} />
      </group>
      <mesh ref={marker} position={[0, 3.3, 0]}>
        <octahedronGeometry args={[0.28]} />
        <meshStandardMaterial color="#ffd36b" emissive="#ffb000" emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
      {labels && (
        <Label position={[0, 4, 0]} center zIndexRange={[10, 0]}>
          <button type="button" onClick={() => onSelect(selectionId('guide', g.guide.id))} className="pointer-events-auto whitespace-nowrap rounded-full bg-accent px-2 py-0.5 font-sans text-[11px] text-paper shadow">
            {g.guide.name}
          </button>
        </Label>
      )}
    </group>
  )
}

/** Guides stand by their landmark; clicking opens a conversation with the AI tutor in their mode. */
export function Guides({ guides, map, onSelect, labels }: { guides: PlacedGuide[]; map: WorldMap; onSelect: (id: SelectionId) => void; labels: boolean }) {
  const looks = useMemo(() => {
    const rand = mulberry32(map.seed + 9)
    return guides.map(() => ({ ...makeLook(map, rand, true), carry: false }))
  }, [guides, map])
  return (
    <group>
      {guides.map((g, i) => <Guide key={g.guide.id} g={g} look={looks[i]!} onSelect={onSelect} labels={labels} />)}
    </group>
  )
}
