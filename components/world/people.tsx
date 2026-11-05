'use client'

import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type * as THREE from 'three'
import type { WorldMap } from '@/lib/content/schema/world'
import { mulberry32 } from '@/lib/finance/random'
import type { PlacedGuide, Pos } from '@/lib/world/layout'
import type { Terrain } from '@/lib/world/terrain'
import { Label } from './label-portal'
import { selectionId, type SelectionId } from './scene-types'

interface Look { skin: string; cloth: string; pants: string; hair: string; hat: boolean; height: number }

/** A stylised person: legs, torso, arms, head, hair, optional conical hat. Limbs swing while walking. */
function Person({ look, limbs }: { look: Look; limbs: React.RefObject<(THREE.Object3D | null)[]> }) {
  const s = look.height / 1.7
  const set = (i: number) => (el: THREE.Object3D | null) => void (limbs.current[i] = el)
  return (
    <group scale={s}>
      {[-0.11, 0.11].map((x, i) => (
        <group key={x} ref={set(i)} position={[x, 0.9, 0]}>
          <mesh position={[0, -0.45, 0]} castShadow>
            <capsuleGeometry args={[0.075, 0.75, 4, 8]} />
            <meshStandardMaterial color={look.pants} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.2, 0]} castShadow>
        <capsuleGeometry args={[0.19, 0.4, 4, 10]} />
        <meshStandardMaterial color={look.cloth} roughness={0.9} />
      </mesh>
      {[-0.26, 0.26].map((x, i) => (
        <group key={x} ref={set(i + 2)} position={[x, 1.42, 0]}>
          <mesh position={[0, -0.3, 0]} castShadow>
            <capsuleGeometry args={[0.055, 0.5, 4, 8]} />
            <meshStandardMaterial color={look.cloth} />
          </mesh>
          <mesh position={[0, -0.6, 0]}>
            <sphereGeometry args={[0.06, 8, 6]} />
            <meshStandardMaterial color={look.skin} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.06, 0.07, 0.1, 8]} />
        <meshStandardMaterial color={look.skin} />
      </mesh>
      <mesh position={[0, 1.76, 0]} castShadow>
        <sphereGeometry args={[0.13, 14, 12]} />
        <meshStandardMaterial color={look.skin} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.8, -0.02]} scale={[1.05, 0.9, 1.05]}>
        <sphereGeometry args={[0.135, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={look.hair} roughness={1} />
      </mesh>
      {look.hat && (
        <mesh position={[0, 1.95, 0]}>
          <coneGeometry args={[0.36, 0.26, 18]} />
          <meshStandardMaterial color="#e8d9a8" roughness={1} />
        </mesh>
      )}
    </group>
  )
}

function Walker({ terrain, points, look, seed, speed }: { terrain: Terrain; points: Pos[]; look: Look; seed: number; speed: number }) {
  const body = useRef<THREE.Group>(null)
  const limbs = useRef<(THREE.Object3D | null)[]>([])
  const rand = useMemo(() => mulberry32(seed), [seed])
  const state = useRef({ from: points[seed % points.length]!, to: points[(seed * 7 + 3) % points.length]!, f: 0, wait: 0 })
  useFrame(({ clock }, dt) => {
    const g = body.current
    const s = state.current
    if (!g) return
    if (s.wait > 0) s.wait -= dt
    else {
      const dist = Math.hypot(s.to[0] - s.from[0], s.to[2] - s.from[2]) || 1
      s.f += (speed * dt) / dist
      if (s.f >= 1) {
        s.from = s.to
        s.to = points[Math.floor(rand() * points.length)]!
        s.f = 0
        s.wait = 2 + rand() * 6
      }
    }
    // Walk to a spot beside the target (not inside the house).
    const ox = Math.sin(seed) * 6
    const oz = Math.cos(seed) * 6
    const x = s.from[0] + ox + (s.to[0] - s.from[0]) * s.f
    const z = s.from[2] + oz + (s.to[2] - s.from[2]) * s.f
    g.position.set(x, terrain.height(x, z), z)
    g.rotation.y = Math.atan2(s.to[0] - s.from[0], s.to[2] - s.from[2])
    const swing = s.wait > 0 ? 0 : Math.sin(clock.elapsedTime * speed * 5 + seed) * 0.5
    const l = limbs.current
    if (l[0]) l[0].rotation.x = swing
    if (l[1]) l[1].rotation.x = -swing
    if (l[2]) l[2].rotation.x = -swing * 0.8
    if (l[3]) l[3].rotation.x = swing * 0.8
  })
  return (
    <group ref={body}>
      <Person look={look} limbs={limbs} />
    </group>
  )
}

function makeLook(map: WorldMap, rand: () => number, lowland: boolean): Look {
  const p = map.people
  const at = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)]!
  return { skin: at(p.skin), cloth: at(p.clothes), pants: at(p.clothes), hair: at(p.hair), hat: lowland && rand() < 0.5, height: 1.55 + rand() * 0.3 }
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

/** Guides stand by their landmark; clicking opens a conversation with the AI tutor in their mode. */
export function Guides({ guides, map, onSelect, labels }: { guides: PlacedGuide[]; map: WorldMap; onSelect: (id: SelectionId) => void; labels: boolean }) {
  const limbs = useRef<(THREE.Object3D | null)[]>([])
  const looks = useMemo(() => {
    const rand = mulberry32(map.seed + 9)
    return guides.map(() => makeLook(map, rand, true))
  }, [guides, map])
  return (
    <group>
      {guides.map((g, i) => (
        <group
          key={g.guide.id}
          position={g.position}
          rotation-y={g.rotation + Math.PI}
          onClick={(e) => {
            e.stopPropagation()
            onSelect(selectionId('guide', g.guide.id))
          }}
        >
          <group scale={1.4}>
            <Person look={looks[i]!} limbs={limbs} />
          </group>
          <mesh position={[0, 3.6, 0]} rotation-z={Math.PI / 4}>
            <octahedronGeometry args={[0.35]} />
            <meshBasicMaterial color="#ffd36b" toneMapped={false} />
          </mesh>
          {labels && (
            <Label position={[0, 4.4, 0]} center zIndexRange={[10, 0]}>
              <button type="button" onClick={() => onSelect(selectionId('guide', g.guide.id))} className="pointer-events-auto whitespace-nowrap rounded-full bg-accent px-2 py-0.5 font-sans text-[11px] text-paper shadow">
                {g.guide.name}
              </button>
            </Label>
          )}
        </group>
      ))}
    </group>
  )
}
