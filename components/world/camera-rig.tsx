'use client'

import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState, type ComponentRef } from 'react'
import * as THREE from 'three'
import type { WorldView } from '@/lib/content/schema/world'
import type { Pos } from '@/lib/world/layout'
import { trainPose } from './rail-train'
import { playerPose, walkWorld } from './walk-state'

const UP = new THREE.Vector3(0, 1, 0)

/** Beyond this jump in one frame (fast travel), the camera re-seats behind you instead of sliding along. */
const TELEPORT_JUMP = 30

/** Third-person camera for walking: orbit/zoom around you with the mouse or touch, carried along as you move. */
function FollowCamera({ view, limits }: { view: WorldView; limits: { minDistance: number; maxDistance: number } }) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)
  const { camera } = useThree()
  const last = useRef<THREE.Vector3 | null>(null)
  /** The distance you chose, remembered while the camera is drawn in by an obstacle. */
  const pulled = useRef<number | null>(null)
  useFrame(() => {
    const c = controls.current
    if (!c || !playerPose.active) return
    const me = new THREE.Vector3(playerPose.x, playerPose.y, playerPose.z)
    if (!last.current || me.distanceTo(last.current) > TELEPORT_JUMP) {
      // Start behind you: the view's eye/look offsets, turned to your heading.
      const eye = new THREE.Vector3(...view.eye).applyAxisAngle(UP, playerPose.yaw + Math.PI)
      camera.position.copy(me).add(eye)
      c.target.copy(me).add(new THREE.Vector3(...view.look))
      last.current = me.clone()
    }
    const delta = me.clone().sub(last.current)
    last.current.copy(me)
    camera.position.add(delta)
    c.target.add(delta).lerp(me.clone().add(new THREE.Vector3(...view.look)), 0.25)
    camera.position.y = Math.max(camera.position.y, me.y + 0.8)
    c.update()
    // Something (a house, a tree) between you and the camera: draw the camera in to the last clear point.
    // Once clear again, it eases back out to the distance it had before.
    const blocked = walkWorld.blocked
    if (blocked) {
      const head = c.target
      const dir = camera.position.clone().sub(head)
      const want = Math.max(dir.length(), pulled.current ?? 0)
      dir.normalize()
      let free = want
      for (let k = 1; k <= 12; k++) {
        const p = head.clone().addScaledVector(dir, (want * k) / 12)
        if (blocked(p.x, p.z) && p.y < head.y + 6) {
          free = Math.max(limits.minDistance * 0.5, (want * (k - 1)) / 12)
          break
        }
      }
      const now = camera.position.distanceTo(head)
      const next = free < want ? free : Math.min(want, now + 0.25)
      pulled.current = next < want - 0.01 ? want : null
      camera.position.copy(head).addScaledVector(dir, next)
    }
  })
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.1}
      enablePan={false}
      minDistance={limits.minDistance}
      maxDistance={limits.maxDistance}
      maxPolarAngle={1.48}
    />
  )
}

/** Camera for each view: rides the train, sits at an anchor, or orbits freely; flies to a selected place. */
/** `zoom` is the fly-to distance for a selected place (people are framed closer than buildings). */
export function CameraRig(props: { view: WorldView; anchor: Pos | 'train'; focus: Pos | null; zoom?: number; limits: { minDistance: number; maxDistance: number } }) {
  if (props.view.mode === 'walk') return <FollowCamera view={props.view} limits={props.limits} />
  return <FlyCamera {...props} />
}

function FlyCamera({ view, anchor, focus, zoom = 48 }: { view: WorldView; anchor: Pos | 'train'; focus: Pos | null; zoom?: number }) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)
  const { camera } = useThree()
  // The overview drifts slowly like an establishing shot until the viewer takes control.
  const [touched, setTouched] = useState(false)
  const fly = useRef<{ eye: THREE.Vector3; look: THREE.Vector3; left: number } | null>(null)

  useEffect(() => {
    if (anchor === 'train') return
    const base = new THREE.Vector3(...anchor)
    const target = focus ? new THREE.Vector3(...focus).add(new THREE.Vector3(0, zoom < 20 ? 1.4 : 0, 0)) : base.clone().add(new THREE.Vector3(...view.look))
    const eye = focus
      ? target.clone().add(camera.position.clone().sub(target).setY(0).normalize().multiplyScalar(zoom)).add(new THREE.Vector3(0, zoom * 0.7, 0))
      : base.clone().add(new THREE.Vector3(...view.eye))
    fly.current = { eye, look: target, left: 6 }
  }, [view, anchor, focus, zoom, camera])

  useFrame((_, dt) => {
    const c = controls.current
    if (anchor === 'train') {
      const f = trainPose.forward
      const right = new THREE.Vector3().crossVectors(f, UP).normalize()
      const at = (v: readonly number[]) => trainPose.position.clone().addScaledVector(right, v[0]!).addScaledVector(UP, v[1]!).addScaledVector(f, v[2]!)
      camera.position.lerp(at(view.eye), Math.min(1, dt * 6))
      camera.lookAt(at(view.look))
      return
    }
    const fl = fly.current
    if (fl && c) {
      const k = Math.min(1, dt * 2.6)
      camera.position.lerp(fl.eye, k)
      c.target.lerp(fl.look, k)
      fl.left -= dt
      if (fl.left <= 0 || camera.position.distanceTo(fl.eye) < 0.5) fly.current = null
    }
    c?.update()
  })

  if (anchor === 'train') return null
  const overview = view.anchor.kind === 'overview' || focus !== null
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      autoRotate={view.anchor.kind === 'overview' && focus === null && !touched}
      autoRotateSpeed={0.35}
      onStart={() => setTouched(true)}
      enableDamping
      dampingFactor={0.08}
      maxPolarAngle={overview ? 1.42 : 1.55}
      minDistance={focus ? Math.min(25, zoom * 0.5) : overview ? 25 : 2}
      maxDistance={overview ? 1300 : 120}
      enablePan={overview}
    />
  )
}
