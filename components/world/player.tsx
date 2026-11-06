'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { Action, ModelAsset } from '@/lib/content/schema/assets'
import type { WorldMap } from '@/lib/content/schema/world'
import type { HeightGrid } from '@/lib/world/grid'
import type { Pos, WorldLayout } from '@/lib/world/layout'
import { bridgeDeck } from '@/lib/world/roads'
import type { Terrain } from '@/lib/world/terrain'
import { CircleGrid, collidersFor, insideAny, nearestReachable, rayGround, stepWalk, type Reachable, type WalkState } from '@/lib/world/walk'
import { Character } from './assets/character'
import { playerPose, walkInput, walkWorld } from './walk-state'

const UP = new THREE.Vector3(0, 1, 0)
/** How often (s) the nearest enterable place is recomputed. */
const NEAR_EVERY = 0.2
/** A press that moves less than this (px) and is shorter than CLICK_MS is a click, not a camera drag. */
const CLICK_PX = 6
const CLICK_MS = 450

export interface PlayerProps {
  terrain: Terrain
  grid: HeightGrid
  layout: WorldLayout
  player: WorldMap['player']
  spawn: Pos
  reachables: Reachable[]
  /** Your character model (assets.yaml cast.player). */
  model: ModelAsset
  onNear: (r: Reachable | null) => void
}

/** Click (not drag) on the canvas → walk to the ground point under the cursor. */
function useGroundClick(grid: HeightGrid) {
  const { gl, camera } = useThree()
  useEffect(() => {
    const el = gl.domElement
    let down: { x: number; y: number; at: number } | null = null
    const ray = new THREE.Raycaster()
    const onDown = (e: PointerEvent) => void (down = { x: e.clientX, y: e.clientY, at: performance.now() })
    const onUp = (e: PointerEvent) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > CLICK_PX || performance.now() - down.at > CLICK_MS) return
      const r = el.getBoundingClientRect()
      ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera)
      const hit = rayGround(ray.ray.origin.toArray(), ray.ray.direction.toArray(), grid.at)
      if (hit) walkInput.target = [hit[0], hit[2]]
      down = null
    }
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointerup', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointerup', onUp)
    }
  }, [gl, camera, grid])
}

/** Camera-relative input (or a click target) turned into a world-space direction. */
function intent(camera: THREE.Camera, s: WalkState) {
  if (walkInput.x || walkInput.z) {
    const f = new THREE.Vector3()
    camera.getWorldDirection(f)
    f.y = 0
    f.normalize()
    const r = new THREE.Vector3().crossVectors(f, UP)
    return { x: f.x * walkInput.z + r.x * walkInput.x, z: f.z * walkInput.z + r.z * walkInput.x, run: walkInput.run }
  }
  const t = walkInput.target
  if (!t) return { x: 0, z: 0, run: false }
  const dx = t[0] - s.x
  const dz = t[1] - s.z
  const d = Math.hypot(dx, dz)
  if (d < 0.7) {
    walkInput.target = null
    return { x: 0, z: 0, run: false }
  }
  // Long walks run; the last metres slow down.
  return { x: dx / d * Math.min(1, d / 2), z: dz / d * Math.min(1, d / 2), run: d > 25 || walkInput.run }
}

/** You: a villager you steer with keys, clicks or the joystick; reports the nearest place you can enter. */
export function Player({ terrain, grid, layout, player, spawn, reachables, model, onNear }: PlayerProps) {
  const body = useRef<THREE.Group>(null)
  const [action, setAction] = useState<Action>('idle')
  const [clipSpeed, setClipSpeed] = useState(1)
  const anim = useRef<{ action: Action; speed: number }>({ action: 'idle', speed: 1 })
  const marker = useRef<THREE.Mesh>(null)
  const arrow = useRef<THREE.Mesh>(null)
  const env = useMemo(
    () => ({ terrain, player, grid: new CircleGrid(collidersFor(layout)), deck: (x: number, z: number) => bridgeDeck(layout.road, x, z) }),
    [terrain, player, layout],
  )
  const state = useRef<WalkState>({ x: spawn[0], z: spawn[2], y: spawn[1], yaw: 0, speed: 0, swimming: false })
  const moved = useRef(0)
  const near = useRef<{ id: string | null; left: number; item: Reachable | null }>({ id: null, left: 0, item: null })
  const { camera } = useThree()
  useGroundClick(grid)

  // The spawn follows your learning data as it loads — but never yanks you back once you have walked off.
  useEffect(() => {
    if (moved.current < 1) state.current = { ...state.current, x: spawn[0], z: spawn[2], y: spawn[1] }
  }, [spawn])
  useEffect(() => {
    playerPose.active = true
    // Crowns spread wider than trunks: a generous margin keeps the camera out of foliage too.
    walkWorld.blocked = (x, z) => insideAny(env.grid, x, z, 1.2)
    return () => {
      walkWorld.blocked = null
      playerPose.active = false
      walkInput.target = null
    }
  }, [env])

  useFrame(({ clock }, dt) => {
    const step = Math.min(dt, 0.05)
    let s = state.current
    if (walkInput.teleport) {
      const { at, face } = walkInput.teleport
      walkInput.teleport = null
      walkInput.target = null
      s = { ...s, x: at[0], z: at[1], speed: 0, yaw: face ? Math.atan2(face[0] - at[0], face[1] - at[1]) : s.yaw }
      moved.current = Infinity
    }
    const next = stepWalk(s, intent(camera, s), step, env)
    moved.current += Math.hypot(next.x - s.x, next.z - s.z)
    state.current = next
    Object.assign(playerPose, { x: next.x, y: next.y, z: next.z, yaw: next.yaw, speed: next.speed, swimming: next.swimming })
    const g = body.current
    if (g) {
      g.position.set(next.x, next.y, next.z)
      g.rotation.y = next.yaw
      // Pick the clip from the ground speed, and play it at a rate that keeps feet from sliding.
      const run = next.speed > player.walkSpeed * 1.25
      const act: Action = next.speed < 0.25 ? 'idle' : run ? 'run' : 'walk'
      const rate = act === 'idle' ? 1 : Math.round((next.speed / (run ? player.runSpeed : player.walkSpeed)) * 10) / 10
      if (act !== anim.current.action || Math.abs(rate - anim.current.speed) > 0.15) {
        anim.current = { action: act, speed: rate }
        setAction(act)
        setClipSpeed(Math.max(0.4, rate))
      }
    }
    const m = marker.current
    if (m) {
      const t = walkInput.target
      m.visible = t !== null
      if (t) {
        m.position.set(t[0], grid.at(t[0], t[1]) + 0.08, t[1])
        m.scale.setScalar(1 + Math.sin(clock.elapsedTime * 6) * 0.12)
      }
    }
    const n = near.current
    n.left -= dt
    if (n.left <= 0) {
      n.left = NEAR_EVERY
      const item = nearestReachable(reachables, next.x, next.z, player.interactRadius)
      const id = item ? `${item.kind}:${item.id}` : null
      if (id !== n.id) {
        n.id = id
        n.item = item
        onNear(item)
      }
    }
    const r = arrow.current
    if (r) {
      r.visible = n.item !== null
      if (n.item) {
        // A small arrow bobbing above the place you can enter (pointing down at it).
        r.position.set(n.item.x, grid.at(n.item.x, n.item.z) + 2.6 + n.item.r * 1.1 + Math.sin(clock.elapsedTime * 3) * 0.25, n.item.z)
        r.rotation.set(Math.PI, clock.elapsedTime * 1.5, 0)
      }
    }
  })

  return (
    <>
      <group ref={body}>
        <Suspense fallback={null}>
          <Character model={model} action={action} speed={clipSpeed} />
        </Suspense>
      </group>
      <mesh ref={marker} rotation-x={-Math.PI / 2} visible={false}>
        <ringGeometry args={[0.35, 0.55, 32]} />
        <meshBasicMaterial color="#fff2c4" transparent opacity={0.85} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh ref={arrow} visible={false}>
        <coneGeometry args={[0.45, 0.9, 4]} />
        <meshStandardMaterial color="#ffd36b" emissive="#ffb000" emissiveIntensity={2.2} toneMapped={false} />
      </mesh>
    </>
  )
}
