'use client'

import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { Terrain } from '@/lib/world/terrain'
import { Box } from './models/parts'

/** Pose of the lead carriage, read by the camera rig for the "inside the train" view. */
export const trainPose = { position: new THREE.Vector3(), forward: new THREE.Vector3(0, 0, 1), t: 0 }

function strip(terrain: Terrain, offset: number, width: number, lift: number) {
  const n = Math.round(terrain.rail.length / 2)
  const pos: number[] = []
  const idx: number[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const [x, z] = terrain.rail.at(t)
    const [tx, tz] = terrain.rail.tangent(t)
    const y = terrain.railHeight(t) + lift
    const a = offset - width / 2
    const b = offset + width / 2
    pos.push(x - tz * a, y, z + tx * a, x - tz * b, y, z + tx * b)
    if (i < n) idx.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 1, i * 2 + 2, i * 2 + 3)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/** Ballast, two steel rails, sleepers, and bridge piers where the line runs above the ground. */
export function Railway({ terrain }: { terrain: Terrain }) {
  const ballast = useMemo(() => strip(terrain, 0, 3.4, 0.05), [terrain])
  const rails = useMemo(() => [strip(terrain, -0.72, 0.12, 0.32), strip(terrain, 0.72, 0.12, 0.32)], [terrain])
  const sleepers = useRef<THREE.InstancedMesh>(null)
  const piers = useRef<THREE.InstancedMesh>(null)
  const data = useMemo(() => {
    const step = 1.3
    const n = Math.floor(terrain.rail.length / step)
    const s: THREE.Matrix4[] = []
    const p: THREE.Matrix4[] = []
    const d = new THREE.Object3D()
    for (let i = 0; i < n; i++) {
      const t = i / n
      const [x, z] = terrain.rail.at(t)
      const [tx, tz] = terrain.rail.tangent(t)
      const y = terrain.railHeight(t)
      d.position.set(x, y + 0.2, z)
      d.rotation.set(0, Math.atan2(tx, tz), 0)
      d.scale.set(2.6, 0.18, 0.3)
      d.updateMatrix()
      s.push(d.matrix.clone())
      const gap = y - terrain.height(x, z)
      if (gap > 1.6 && i % 7 === 0) {
        d.position.set(x, y - gap / 2, z)
        d.scale.set(2.2, gap, 1.2)
        d.updateMatrix()
        p.push(d.matrix.clone())
      }
    }
    return { s, p }
  }, [terrain])
  useLayoutEffect(() => {
    data.s.forEach((m, i) => sleepers.current?.setMatrixAt(i, m))
    data.p.forEach((m, i) => piers.current?.setMatrixAt(i, m))
    if (sleepers.current) sleepers.current.instanceMatrix.needsUpdate = true
    if (piers.current) piers.current.instanceMatrix.needsUpdate = true
  }, [data])
  return (
    <group>
      <mesh geometry={ballast} receiveShadow>
        <meshStandardMaterial color="#6d665c" roughness={1} />
      </mesh>
      {rails.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshStandardMaterial color="#9aa0a6" metalness={0.8} roughness={0.35} side={THREE.DoubleSide} />
        </mesh>
      ))}
      <instancedMesh ref={sleepers} args={[undefined, undefined, data.s.length]} receiveShadow>
        <boxGeometry />
        <meshStandardMaterial color="#5a4632" roughness={1} />
      </instancedMesh>
      {data.p.length > 0 && (
        <instancedMesh ref={piers} args={[undefined, undefined, data.p.length]} castShadow>
          <boxGeometry />
          <meshStandardMaterial color="#8d887e" roughness={1} />
        </instancedMesh>
      )}
    </group>
  )
}

const CAR = 13
const GAP = 1.2

/** Carriage with an open window band so the camera inside can look out. */
function Carriage({ color, lead, night }: { color: string; lead: boolean; night: boolean }) {
  const pillars = [-5, -2.5, 0, 2.5, 5]
  return (
    <group>
      <Box at={[0, 0.9, 0]} size={[3, 0.3, CAR]} color="#3b3b3b" />
      {[-1.45, 1.45].map((x) => (
        <group key={x}>
          <Box at={[x, 1.35, 0]} size={[0.1, 0.7, CAR]} color={color} />
          <Box at={[x, 3.45, 0]} size={[0.1, 0.3, CAR]} color={color} />
          {pillars.map((z) => <Box key={z} at={[x, 2.5, z]} size={[0.12, 1.6, 0.25]} color={color} />)}
        </group>
      ))}
      {[-CAR / 2, CAR / 2].map((z) => <Box key={z} at={[0, 2.2, z]} size={[3, 2.8, 0.1]} color={color} />)}
      <Box at={[0, 3.7, 0]} size={[3.2, 0.2, CAR + 0.2]} color="#e8e2d4" />
      {[-4, -1.5, 1, 3.5].map((z) => <Box key={z} at={[0.7, 1.4, z]} size={[1, 0.5, 0.9]} color="#7a4a3a" />)}
      {night && <pointLight position={[0, 3.3, 0]} intensity={4} distance={10} color="#ffd9a0" />}
      {lead && <Box at={[0, 2.2, CAR / 2 + 0.6]} size={[2.6, 2.4, 1]} color="#2f4b7c" />}
      {[-4.5, 4.5].flatMap((z) => [-1.2, 1.2].map((x) => (
        <mesh key={`${x}${z}`} position={[x, 0.55, z]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.5, 0.5, 0.2, 12]} />
          <meshStandardMaterial color="#222" metalness={0.6} />
        </mesh>
      )))}
    </group>
  )
}

/** The train; `getT()` gives its position on the line (0–1), so focus progress drives it without re-renders. */
export function Train({ terrain, getT, night }: { terrain: Terrain; getT: () => number; night: boolean }) {
  const cars = useRef<(THREE.Group | null)[]>([])
  const colors = ['#a13d2d', '#d9cba8', '#d9cba8', '#d9cba8']
  const current = useRef(getT())
  useFrame((_, dt) => {
    const target = getT()
    current.current += (target - current.current) * Math.min(1, dt * 1.5)
    const L = terrain.rail.length
    cars.current.forEach((g, i) => {
      if (!g) return
      const t = Math.min(1, Math.max(0, current.current - (i * (CAR + GAP)) / L))
      const [x, z] = terrain.rail.at(t)
      const [tx, tz] = terrain.rail.tangent(t)
      g.position.set(x, terrain.railHeight(t) + 0.3, z)
      g.rotation.set(0, Math.atan2(tx, tz), 0)
      if (i === 1) {
        trainPose.position.copy(g.position)
        trainPose.forward.set(tx, 0, tz)
        trainPose.t = t
      }
    })
  })
  return (
    <group>
      {colors.map((c, i) => (
        <group key={i} ref={(el) => void (cars.current[i] = el)}>
          <Carriage color={c} lead={i === 0} night={night} />
        </group>
      ))}
    </group>
  )
}
