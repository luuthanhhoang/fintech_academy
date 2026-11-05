'use client'

import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { GroundCover as Cover } from '@/lib/world/grass'

/** Three curved, tapered blades in one clump (height 1, so the instance scale sets the height). */
export function clumpGeometry() {
  const blades = [0, 2.1, 4.2].map((rot, k) => {
    const levels = 5
    const pos: number[] = []
    const nor: number[] = []
    for (let i = 0; i < levels; i++) {
      const t = i / (levels - 1)
      const w = 0.07 * (1 - t) + 0.004
      const bend = t * t * 0.25
      pos.push(-w, t, bend, w, t, bend)
      nor.push(0, 1, 0.3, 0, 1, 0.3)
    }
    const idx: number[] = []
    for (let i = 0; i < levels - 1; i++) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
    g.setIndex(idx)
    g.rotateY(rot)
    g.translate(Math.cos(rot) * 0.06 * k, 0, Math.sin(rot) * 0.06 * k)
    return g
  })
  return mergeGeometries(blades)
}

function useInstanceData(ref: React.RefObject<THREE.InstancedMesh | null>, cover: Cover, height: number, color: (seed: number) => THREE.Color) {
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    const d = new THREE.Object3D()
    for (let i = 0; i < cover.count; i++) {
      const s = cover.seeds[i]!
      d.position.set(cover.positions[i * 3]!, cover.positions[i * 3 + 1]! - 0.05, cover.positions[i * 3 + 2]!)
      d.rotation.set(0, s * 40, 0)
      const hgt = height * (0.6 + s * 0.8)
      d.scale.set(1 + s * 0.6, hgt, 1 + s * 0.6)
      d.updateMatrix()
      m.setMatrixAt(i, d.matrix)
      m.setColorAt(i, color(s))
    }
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
    m.computeBoundingSphere()
  }, [ref, cover, height, color])
}

/** Small wildflowers: green stems + coloured heads (colours from graphics.yaml). */
export function Flowers({ cover, colors }: { cover: Cover; colors: string[] }) {
  const stems = useRef<THREE.InstancedMesh>(null)
  const heads = useRef<THREE.InstancedMesh>(null)
  const palette = useMemo(() => colors.map((c) => new THREE.Color(c).convertSRGBToLinear()), [colors])
  const stemGreen = useMemo(() => () => new THREE.Color('#4f7a2c').convertSRGBToLinear(), [])
  const headColor = useMemo(() => (s: number) => palette[Math.floor(s * palette.length) % palette.length]!, [palette])
  const stemGeom = useMemo(() => new THREE.CylinderGeometry(0.012, 0.015, 1, 3).translate(0, 0.5, 0), [])
  const headGeom = useMemo(() => new THREE.CylinderGeometry(0.09, 0.03, 0.1, 6).translate(0, 1, 0), [])
  useInstanceData(stems, cover, 0.5, stemGreen)
  useInstanceData(heads, cover, 0.5, headColor)
  if (cover.count === 0) return null
  return (
    <group>
      <instancedMesh ref={stems} args={[stemGeom, undefined, cover.count]}>
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[headGeom, undefined, cover.count]}>
        <meshStandardMaterial color="#ffffff" roughness={0.6} emissive="#ffffff" emissiveIntensity={0.05} />
      </instancedMesh>
    </group>
  )
}
