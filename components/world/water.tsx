'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { Terrain } from '@/lib/world/terrain'
import { makeWaterMaterial, waterTime } from './water-material'

function ribbon(terrain: Terrain, r: Terrain['rivers'][number]) {
  const n = Math.max(40, Math.round(r.line.length / 4))
  const pos: number[] = []
  const idx: number[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const [x, z] = r.line.at(t)
    const [tx, tz] = r.line.tangent(t)
    const half = r.width * 0.62
    const y = r.surface(t) + 0.05
    pos.push(x - tz * half, y, z + tx * half, x + tz * half, y, z - tx * half)
    if (i < n) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/** Sea, rivers and lakes. Wave height follows the wind of the current weather. */
export function Water({ terrain, wind }: { terrain: Terrain; wind: number }) {
  const size = terrain.map.size
  const sea = useMemo(() => makeWaterMaterial({ color: '#1f5f7a', amplitude: 0.6, scale: 0.09 }), [])
  const fresh = useMemo(() => makeWaterMaterial({ color: '#4d8f94', amplitude: 0.06, scale: 0.6, opacity: 0.88 }), [])
  const seaGeom = useMemo(() => {
    const g = new THREE.PlaneGeometry(size * 3, size * 3, 160, 160)
    g.rotateX(-Math.PI / 2)
    return g
  }, [size])
  const rivers = useMemo(() => terrain.rivers.map((r) => ({ id: r.id, geometry: ribbon(terrain, r) })), [terrain])
  // Geometry is built y-up in object space so the wave normals in the shader stay correct.
  const lakes = useMemo(
    () =>
      terrain.lakes.map((l) => {
        const g = new THREE.CircleGeometry(l.radius * 1.12, 48)
        g.rotateX(-Math.PI / 2)
        g.translate(l.center[0], l.surface + 0.05, l.center[1])
        return { id: l.id, geometry: g }
      }),
    [terrain],
  )
  useEffect(() => {
    sea.amplitude.value = 0.25 + wind * 1.2
    fresh.amplitude.value = 0.03 + wind * 0.08
  }, [wind, sea, fresh])
  useFrame((_, dt) => {
    waterTime.value += dt
  })
  return (
    <group>
      <mesh geometry={seaGeom} material={sea.material} position={[0, 0, 0]} receiveShadow />
      {rivers.map((r) => (
        <mesh key={r.id} geometry={r.geometry} material={fresh.material} />
      ))}
      {lakes.map((l) => (
        <mesh key={l.id} geometry={l.geometry} material={fresh.material} />
      ))}
    </group>
  )
}

/** Fish in a pond: one per due review card (capped), circling under the surface; one occasionally leaps. */
export function Fish({ center, radius, surface, count }: { center: [number, number]; radius: number; surface: number; count: number }) {
  const group = useRef<THREE.Group>(null)
  const fish = useMemo(
    () => Array.from({ length: count }, (_, i) => ({ r: radius * (0.25 + ((i * 37) % 60) / 100), speed: 0.15 + ((i * 13) % 10) / 40, phase: i * 1.7, dir: i % 2 ? 1 : -1 })),
    [count, radius],
  )
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    group.current?.children.forEach((child, i) => {
      const f = fish[i]
      if (!f) return
      const a = f.phase + t * f.speed * f.dir
      const leap = Math.max(0, Math.sin(t * 0.7 + f.phase * 3) - 0.985) * 60
      child.position.set(center[0] + Math.cos(a) * f.r, surface - 0.35 + leap, center[1] + Math.sin(a) * f.r)
      child.rotation.y = -a + (f.dir > 0 ? Math.PI : 0)
    })
  })
  return (
    <group ref={group}>
      {fish.map((_, i) => (
        <group key={i}>
          <mesh scale={[0.25, 0.18, 0.6]}>
            <sphereGeometry args={[1, 10, 8]} />
            <meshStandardMaterial color={i % 3 === 0 ? '#e0703a' : i % 3 === 1 ? '#f2f0ea' : '#d9a441'} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, -0.65]} rotation-x={Math.PI / 2} scale={[0.2, 0.3, 0.05]}>
            <coneGeometry args={[1, 1, 3]} />
            <meshStandardMaterial color="#c75f30" />
          </mesh>
        </group>
      ))}
    </group>
  )
}
