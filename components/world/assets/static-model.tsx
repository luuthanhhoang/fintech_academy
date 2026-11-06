'use client'

import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { ModelAsset } from '@/lib/content/schema/assets'
import { litMaterial, modelParts, useModel } from './use-model'

/** One copy of a static model (vehicle, building, prop), lit and casting shadows, at real-world scale. */
export function StaticModel({ model, scale = 1 }: { model: ModelAsset; scale?: number }) {
  const { scene, scale: real } = useModel(model)
  const copy = useMemo(() => {
    const c = scene.clone(true)
    c.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(litMaterial) : litMaterial(mesh.material)
    })
    return c
  }, [scene])
  return <primitive object={copy} scale={real * scale} />
}

export interface Placement { position: [number, number, number]; rotation: number; scale?: number }

/** Many copies of one model in a single draw call per part (fences, crates…). */
export function InstancedModel({ model, items, shadows = true }: { model: ModelAsset; items: Placement[]; shadows?: boolean }) {
  const { scene } = useModel(model)
  const parts = useMemo(() => modelParts(scene, model), [scene, model])
  const refs = useRef<(THREE.InstancedMesh | null)[]>([])
  useLayoutEffect(() => {
    const d = new THREE.Object3D()
    for (const mesh of refs.current) {
      if (!mesh) continue
      items.forEach((it, i) => {
        d.position.set(...it.position)
        d.rotation.set(0, it.rotation, 0)
        d.scale.setScalar(it.scale ?? 1)
        d.updateMatrix()
        mesh.setMatrixAt(i, d.matrix)
      })
      mesh.instanceMatrix.needsUpdate = true
      mesh.computeBoundingSphere()
    }
  }, [items, parts])
  if (items.length === 0) return null
  return (
    <group>
      {parts.map((p, k) => (
        <instancedMesh key={k} ref={(el) => void (refs.current[k] = el)} args={[p.geometry, p.material, items.length]} castShadow={shadows} receiveShadow />
      ))}
    </group>
  )
}
