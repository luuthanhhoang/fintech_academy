'use client'

import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, type ComponentRef } from 'react'
import * as THREE from 'three'
import type { WorldView } from '@/lib/content/schema/world'
import type { Pos } from '@/lib/world/layout'
import { trainPose } from './rail-train'

const UP = new THREE.Vector3(0, 1, 0)

/** Camera for each view: rides the train, sits at an anchor, or orbits freely; flies to a selected place. */
/** `zoom` is the fly-to distance for a selected place (people are framed closer than buildings). */
export function CameraRig({ view, anchor, focus, zoom = 48 }: { view: WorldView; anchor: Pos | 'train'; focus: Pos | null; zoom?: number }) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)
  const { camera } = useThree()
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
      enableDamping
      dampingFactor={0.08}
      maxPolarAngle={overview ? 1.42 : 1.55}
      minDistance={focus ? Math.min(25, zoom * 0.5) : overview ? 25 : 2}
      maxDistance={overview ? 1300 : 120}
      enablePan={overview}
    />
  )
}
