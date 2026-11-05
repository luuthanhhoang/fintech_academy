'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { HeightGrid } from '@/lib/world/grid'
import type { BlendedLook } from '@/lib/world/looks'
import type { Terrain } from '@/lib/world/terrain'
import { makeWaterMaterial, waterTime, type WaterLook } from './water-material'

function ribbon(r: Terrain['rivers'][number]) {
  const n = Math.max(40, Math.round(r.line.length / 3))
  const pos: number[] = []
  const idx: number[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const [x, z] = r.line.at(t)
    const [tx, tz] = r.line.tangent(t)
    const half = r.width * 0.75
    const y = r.surface(t) + 0.05
    pos.push(x - tz * half, y, z + tx * half, x + tz * half, y, z - tx * half)
    if (i < n) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  return g
}

export interface WaterProps {
  terrain: Terrain
  grid: HeightGrid
  look: BlendedLook
  sunDir: [number, number, number]
  water: WaterLook
  wind: number
  rain: number
}

/** Sea, rivers and lakes sharing one physically-inspired water shader. */
export function Water({ terrain, grid, look, sunDir, water, wind, rain }: WaterProps) {
  const size = terrain.map.size
  const sea = useMemo(() => makeWaterMaterial(grid, water, 0.9, 0.5), [grid, water])
  const fresh = useMemo(() => makeWaterMaterial(grid, { ...water, clarity: water.clarity * 0.6 }, 0.45, 0), [grid, water])
  const seaGeom = useMemo(() => {
    const g = new THREE.PlaneGeometry(size * 4, size * 4, 220, 220)
    g.rotateX(-Math.PI / 2)
    return g
  }, [size])
  const rivers = useMemo(() => terrain.rivers.map((r) => ({ id: r.id, geometry: ribbon(r) })), [terrain])
  const lakes = useMemo(
    () =>
      terrain.lakes.map((l) => {
        const g = new THREE.CircleGeometry(l.radius * 1.2, 64)
        g.rotateX(-Math.PI / 2)
        g.translate(l.center[0], l.surface + 0.05, l.center[1])
        return { id: l.id, geometry: g }
      }),
    [terrain],
  )
  useEffect(() => {
    for (const m of [sea, fresh]) {
      const u = m.uniforms
      u.uSunDir!.value.set(...sunDir)
      u.uSun!.value.setRGB(...look.sun, THREE.SRGBColorSpace)
      u.uZenith!.value.setRGB(...look.zenith, THREE.SRGBColorSpace)
      u.uHorizon!.value.setRGB(...look.horizon, THREE.SRGBColorSpace)
      u.uRain!.value = rain
    }
    sea.uniforms.uAmp!.value = 0.2 + wind * 0.9
    sea.uniforms.uRipple!.value = 0.6 + wind * 1.4
  }, [sea, fresh, look, sunDir, wind, rain])
  useFrame((_, dt) => {
    waterTime.value += dt
  })
  return (
    <group>
      <mesh geometry={seaGeom} material={sea} renderOrder={1} />
      {rivers.map((r) => <mesh key={r.id} geometry={r.geometry} material={fresh} renderOrder={1} />)}
      {lakes.map((l) => <mesh key={l.id} geometry={l.geometry} material={fresh} renderOrder={1} />)}
    </group>
  )
}

/** Lotus pads and flowers on ponds, reeds around lakes. */
export function Shore({ terrain }: { terrain: Terrain }) {
  const pads = useRef<THREE.InstancedMesh>(null)
  const reeds = useRef<THREE.InstancedMesh>(null)
  const blooms = useRef<THREE.InstancedMesh>(null)
  const data = useMemo(() => {
    const d = new THREE.Object3D()
    const p: THREE.Matrix4[] = []
    const r: THREE.Matrix4[] = []
    const b: THREE.Matrix4[] = []
    terrain.lakes.forEach((l, li) => {
      const count = l.kind === 'pond' ? 46 : 18
      for (let i = 0; i < count; i++) {
        const a = i * 2.399 + li
        const rad = l.radius * (0.35 + ((i * 37) % 55) / 100)
        d.position.set(l.center[0] + Math.cos(a) * rad, l.surface + 0.08, l.center[1] + Math.sin(a) * rad)
        d.rotation.set(-Math.PI / 2, 0, a * 3)
        d.scale.setScalar(0.6 + ((i * 13) % 10) / 12)
        d.updateMatrix()
        p.push(d.matrix.clone())
        if (l.kind === 'pond' && i % 4 === 0) {
          d.position.y += 0.35
          d.rotation.set(0, a, 0)
          d.scale.setScalar(0.5)
          d.updateMatrix()
          b.push(d.matrix.clone())
        }
      }
      for (let i = 0; i < 70; i++) {
        const a = i * 0.7 + li * 3
        const rad = l.radius * (1.05 + ((i * 17) % 20) / 100)
        d.position.set(l.center[0] + Math.cos(a) * rad, l.surface - 0.2, l.center[1] + Math.sin(a) * rad)
        d.rotation.set(((i % 5) - 2) * 0.06, a, ((i % 3) - 1) * 0.08)
        d.scale.set(1, 0.8 + ((i * 7) % 10) / 10, 1)
        d.updateMatrix()
        r.push(d.matrix.clone())
      }
    })
    return { p, r, b }
  }, [terrain])
  useEffect(() => {
    data.p.forEach((m, i) => pads.current?.setMatrixAt(i, m))
    data.r.forEach((m, i) => reeds.current?.setMatrixAt(i, m))
    data.b.forEach((m, i) => blooms.current?.setMatrixAt(i, m))
    for (const ref of [pads, reeds, blooms]) if (ref.current) ref.current.instanceMatrix.needsUpdate = true
  }, [data])
  return (
    <group>
      <instancedMesh ref={pads} args={[undefined, undefined, data.p.length]} receiveShadow>
        <circleGeometry args={[0.9, 14, 0.3, Math.PI * 1.85]} />
        <meshStandardMaterial color="#3f7a35" roughness={0.85} side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={blooms} args={[undefined, undefined, data.b.length]}>
        <coneGeometry args={[0.35, 0.5, 8, 1, true]} />
        <meshStandardMaterial color="#f3a6c0" emissive="#f07aa0" emissiveIntensity={0.15} side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={reeds} args={[undefined, undefined, data.r.length]} castShadow>
        <cylinderGeometry args={[0.03, 0.06, 2.4, 4]} />
        <meshStandardMaterial color="#7f8f4a" roughness={0.9} />
      </instancedMesh>
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
      child.position.set(center[0] + Math.cos(a) * f.r, surface - 0.3 + leap, center[1] + Math.sin(a) * f.r)
      child.rotation.y = -a + (f.dir > 0 ? Math.PI : 0)
    })
  })
  return (
    <group ref={group}>
      {fish.map((_, i) => (
        <group key={i}>
          <mesh scale={[0.22, 0.17, 0.6]}>
            <sphereGeometry args={[1, 12, 10]} />
            <meshStandardMaterial color={['#e0703a', '#f4efe6', '#e8b04a'][i % 3]} roughness={0.35} />
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
