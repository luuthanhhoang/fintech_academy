'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'
import type { Action, ModelAsset } from '@/lib/content/schema/assets'
import { litMaterial, useModel } from './use-model'

const FADE = 0.25

/**
 * An animated model (person or animal): its own skeleton clone and mixer, cross-fading between actions.
 * `speed` scales the walk/run clip so feet match the ground speed. The mixer only runs while `active`
 * (distance culling), so far-away figures cost nothing per frame.
 */
export function Character({ model, action, speed = 1, scale = 1, active = true }: { model: ModelAsset; action: Action; speed?: number; scale?: number; active?: boolean }) {
  const { scene, animations, scale: real } = useModel(model)
  const root = useMemo(() => {
    const c = cloneSkinned(scene)
    c.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.frustumCulled = false
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(litMaterial) : litMaterial(mesh.material)
    })
    return c
  }, [scene])
  const mixer = useMemo(() => new THREE.AnimationMixer(root), [root])
  const current = useRef<THREE.AnimationAction | null>(null)

  useEffect(() => {
    const name = model.clips?.[action] ?? model.clips?.idle
    const clip = animations.find((a) => a.name === name)
    if (!clip) return
    const next = mixer.clipAction(clip)
    if (current.current === next) return
    next.reset().fadeIn(FADE).play()
    current.current?.fadeOut(FADE)
    current.current = next
  }, [action, animations, mixer, model.clips])

  useEffect(() => () => void mixer.stopAllAction(), [mixer])

  useFrame((_, dt) => {
    if (!active) return
    if (current.current) current.current.timeScale = speed
    mixer.update(Math.min(dt, 0.1))
  })

  return <primitive object={root} scale={real * scale} />
}
