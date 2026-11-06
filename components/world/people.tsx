'use client'

import { useFrame } from '@react-three/fiber'
import { Suspense, useMemo, useRef, useState } from 'react'
import type * as THREE from 'three'
import type { Action, ModelAsset } from '@/lib/content/schema/assets'
import { mulberry32 } from '@/lib/finance/random'
import type { PlacedGuide, Pos } from '@/lib/world/layout'
import type { Terrain } from '@/lib/world/terrain'
import { Character } from './assets/character'
import { Label } from './label-portal'
import { useLabelVisible } from './label-declutter'
import { selectionId, type SelectionId } from './scene-types'
import { playerPose } from './walk-state'

/** Villagers are drawn only within this many metres of the camera. */
const SEE_PEOPLE = 170

interface WalkerProps {
  terrain: Terrain
  points: Pos[]
  home: Pos
  model: ModelAsset
  seed: number
  speed: number
  /** True at night: villagers walk home and go indoors. */
  night: boolean
  talkRadius: number
  say: (x: number, z: number) => string | null
}

/** A villager: commutes between houses, the station and landmarks by day, goes home at night, chats when you come near. */
function Walker({ terrain, points, home, model, seed, speed, night, talkRadius, say }: WalkerProps) {
  const body = useRef<THREE.Group>(null)
  const [action, setAction] = useState<Action>('idle')
  const [shown, setShown] = useState(false)
  const rand = useMemo(() => mulberry32(seed), [seed])
  const state = useRef({ x: home[0], z: home[2], to: points[(seed * 7 + 3) % points.length]!, wait: rand() * 5, yaw: 0, indoors: false, action: 'idle' as Action, shown: false })
  const [line, setLine] = useState<string | null>(null)
  const talking = useRef(false)
  useFrame(({ camera }, dt) => {
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
      const target = Math.atan2(dx, dz)
      s.yaw += Math.atan2(Math.sin(target - s.yaw), Math.cos(target - s.yaw)) * Math.min(1, dt * 4)
    } else if (!night) {
      s.to = points[Math.floor(rand() * points.length)]!
      s.wait = 2 + rand() * 7
    }
    s.indoors = night && dist <= 0.6
    // Far away a villager is a few pixels: only render and animate (skin + mixer) the ones near the camera.
    const show = near && !s.indoors
    g.visible = show
    if (show !== s.shown) {
      s.shown = show
      setShown(show)
    }
    const next: Action = meet ? 'wave' : walking ? 'walk' : 'idle'
    if (next !== s.action) {
      s.action = next
      setAction(next)
    }
    if (!show) return
    g.position.set(s.x, terrain.height(s.x, s.z), s.z)
    g.rotation.y = s.yaw
  })
  return (
    <group ref={body}>
      <Character model={model} action={action} speed={walkingClip(speed)} active={shown} />
      {line && (
        <Label position={[0, 2.3, 0]} center zIndexRange={[20, 10]}>
          <p className="pointer-events-none w-56 rounded-xl border border-rule bg-paper/95 px-3 py-2 font-sans text-xs leading-snug text-ink shadow-lg">{line}</p>
        </Label>
      )}
    </group>
  )
}

/** The walk clip is authored for about 1.4 m/s; slower villagers play it slower so feet do not slide. */
const walkingClip = (speed: number) => speed / 1.4

/** Villagers walking between stations, houses and landmarks of their region. */
export function Villagers({ terrain, waypoints, homes, models, density, night, say }: {
  terrain: Terrain
  waypoints: Record<string, Pos[]>
  homes: Record<string, Pos[]>
  /** Villager models (assets.yaml cast.villagers), assigned in turn. */
  models: ModelAsset[]
  density: number
  night: boolean
  say: (x: number, z: number) => string | null
}) {
  const m = terrain.map
  const people = useMemo(() => {
    const regions = m.regions.filter((r) => (waypoints[r.id]?.length ?? 0) > 1)
    return Array.from({ length: regions.length ? Math.round(m.people.count * density) : 0 }, (_, i) => {
      const region = regions[i % regions.length]!
      const own = homes[region.id]?.length ? homes[region.id]! : waypoints[region.id]!
      return { id: i, points: waypoints[region.id]!, home: own[i % own.length]!, model: models[(i * 5) % models.length]! }
    })
  }, [m, waypoints, homes, density, models])
  return (
    <group>
      {people.map((p) => (
        <Suspense key={p.id} fallback={null}>
          <Walker terrain={terrain} points={p.points} home={p.home} model={p.model} seed={p.id + 1} speed={m.people.walkSpeed} night={night} talkRadius={m.people.talkRadius} say={say} />
        </Suspense>
      ))}
    </group>
  )
}

function Guide({ g, model, onSelect, labels }: { g: PlacedGuide; model: ModelAsset; onSelect: (id: SelectionId) => void; labels: boolean }) {
  const marker = useRef<THREE.Mesh>(null)
  const labelOk = useLabelVisible(`guide:${g.guide.id}`)
  const [greet, setGreet] = useState(false)
  const near = useRef(false)
  useFrame(({ clock }) => {
    if (marker.current) {
      marker.current.position.y = 2.6 + Math.sin(clock.elapsedTime * 2) * 0.12
      marker.current.rotation.y = clock.elapsedTime
    }
    // Guides wave when you walk up to them.
    const close = playerPose.active && Math.hypot(playerPose.x - g.position[0], playerPose.z - g.position[2]) < 8
    if (close !== near.current) {
      near.current = close
      setGreet(close)
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
      <Suspense fallback={null}>
        <Character model={model} action={greet ? 'wave' : 'idle'} />
      </Suspense>
      <mesh ref={marker} position={[0, 2.6, 0]}>
        <octahedronGeometry args={[0.24]} />
        <meshStandardMaterial color="#ffd36b" emissive="#ffb000" emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
      {labels && labelOk && (
        <Label position={[0, 3.2, 0]} center zIndexRange={[10, 0]}>
          <button type="button" onClick={() => onSelect(selectionId('guide', g.guide.id))} className="pointer-events-auto whitespace-nowrap rounded-full bg-accent px-2 py-0.5 font-sans text-[11px] text-paper shadow">
            {g.guide.name}
          </button>
        </Label>
      )}
    </group>
  )
}

/** Guides stand by their landmark; clicking opens a conversation with the AI tutor in their mode. */
export function Guides({ guides, models, onSelect, labels }: { guides: PlacedGuide[]; models: ModelAsset[]; onSelect: (id: SelectionId) => void; labels: boolean }) {
  return (
    <group>
      {guides.map((g, i) => <Guide key={g.guide.id} g={g} model={models[i % models.length]!} onSelect={onSelect} labels={labels} />)}
    </group>
  )
}
