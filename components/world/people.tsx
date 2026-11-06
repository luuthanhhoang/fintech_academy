'use client'

import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import type * as THREE from 'three'
import type { WorldMap } from '@/lib/content/schema/world'
import { mulberry32 } from '@/lib/finance/random'
import type { PlacedGuide, Pos } from '@/lib/world/layout'
import type { Terrain } from '@/lib/world/terrain'
import { Label } from './label-portal'
import { Person, pose, type Look } from './person'
import { useLabelVisible } from './label-declutter'
import { selectionId, type SelectionId } from './scene-types'
import { playerPose } from './walk-state'

/** Villagers are drawn only within this many metres of the camera. */
const SEE_PEOPLE = 170

interface WalkerProps {
  terrain: Terrain
  points: Pos[]
  home: Pos
  look: Look
  seed: number
  speed: number
  /** True at night: villagers walk home and go indoors. */
  night: boolean
  talkRadius: number
  say: (x: number, z: number) => string | null
}

/** A villager: commutes between houses, the station and landmarks by day, goes home at night, chats when you come near. */
function Walker({ terrain, points, home, look, seed, speed, night, talkRadius, say }: WalkerProps) {
  const body = useRef<THREE.Group>(null)
  const joints = useRef<(THREE.Object3D | null)[]>([])
  const rand = useMemo(() => mulberry32(seed), [seed])
  const state = useRef({ x: home[0], z: home[2], to: points[(seed * 7 + 3) % points.length]!, wait: rand() * 5, phase: 0, yaw: 0, indoors: false })
  const [line, setLine] = useState<string | null>(null)
  const talking = useRef(false)
  useFrame(({ clock, camera }, dt) => {
    const g = body.current
    const s = state.current
    if (!g) return
    const goal = night ? home : s.to
    const dx = goal[0] - s.x
    const dz = goal[2] - s.z
    const dist = Math.hypot(dx, dz)
    const near = (camera.position.x - s.x) ** 2 + (camera.position.z - s.z) ** 2 < SEE_PEOPLE ** 2
    const meet = playerPose.active && Math.hypot(playerPose.x - s.x, playerPose.z - s.z) < talkRadius
    if (meet !== talking.current) {
      talking.current = meet
      setLine(meet ? say(s.x, s.z) : null)
    }
    let walking = false
    if (meet) {
      s.yaw += Math.atan2(Math.sin(Math.atan2(playerPose.x - s.x, playerPose.z - s.z) - s.yaw), Math.cos(Math.atan2(playerPose.x - s.x, playerPose.z - s.z) - s.yaw)) * Math.min(1, dt * 5)
    } else if (s.wait > 0) s.wait -= dt
    else if (dist > 0.6) {
      walking = true
      s.x += (dx / dist) * speed * dt
      s.z += (dz / dist) * speed * dt
      s.phase += dt * speed * 5.2
      const target = Math.atan2(dx, dz)
      s.yaw += Math.atan2(Math.sin(target - s.yaw), Math.cos(target - s.yaw)) * Math.min(1, dt * 4)
    } else if (!night) {
      s.to = points[Math.floor(rand() * points.length)]!
      s.wait = 2 + rand() * 7
    }
    s.indoors = night && dist <= 0.6
    // Far away a villager is a few pixels but costs ~35 draw calls: only render and animate the ones near the camera.
    g.visible = near && !s.indoors
    if (!g.visible) return
    g.position.set(s.x, terrain.height(s.x, s.z), s.z)
    g.rotation.y = s.yaw
    pose(joints.current, s.phase, walking ? 1 : 0, clock.elapsedTime + seed)
  })
  return (
    <group ref={body}>
      <Person look={look} joints={joints} />
      {line && (
        <Label position={[0, 2.3, 0]} center zIndexRange={[20, 10]}>
          <p className="pointer-events-none w-56 rounded-xl border border-rule bg-paper/95 px-3 py-2 font-sans text-xs leading-snug text-ink shadow-lg">{line}</p>
        </Label>
      )}
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
export function Villagers({ terrain, waypoints, homes, density, night, say }: { terrain: Terrain; waypoints: Record<string, Pos[]>; homes: Record<string, Pos[]>; density: number; night: boolean; say: (x: number, z: number) => string | null }) {
  const m = terrain.map
  const people = useMemo(() => {
    const rand = mulberry32(m.seed + 5)
    const regions = m.regions.filter((r) => (waypoints[r.id]?.length ?? 0) > 1)
    return Array.from({ length: regions.length ? Math.round(m.people.count * density) : 0 }, (_, i) => {
      const region = regions[i % regions.length]!
      const own = homes[region.id]?.length ? homes[region.id]! : waypoints[region.id]!
      return { id: i, points: waypoints[region.id]!, home: own[i % own.length]!, look: makeLook(m, rand, region.biome === 'lowland') }
    })
  }, [m, waypoints, homes, density])
  return (
    <group>
      {people.map((p) => (
        <Walker key={p.id} terrain={terrain} points={p.points} home={p.home} look={p.look} seed={p.id + 1} speed={m.people.walkSpeed} night={night} talkRadius={m.people.talkRadius} say={say} />
      ))}
    </group>
  )
}

function Guide({ g, look, onSelect, labels }: { g: PlacedGuide; look: Look; onSelect: (id: SelectionId) => void; labels: boolean }) {
  const joints = useRef<(THREE.Object3D | null)[]>([])
  const marker = useRef<THREE.Mesh>(null)
  const labelOk = useLabelVisible(`guide:${g.guide.id}`)
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
      {labels && labelOk && (
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
