'use client'

import type { ThreeEvent } from '@react-three/fiber'
import { useFrame } from '@react-three/fiber'
import { Suspense, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { ModelAsset } from '@/lib/content/schema/assets'
import type { WorldMap } from '@/lib/content/schema/world'
import type { Civic } from '@/lib/world/layout'
import { bridgeSpans, busAt, type Road } from '@/lib/world/roads'
import { StaticModel } from './assets/static-model'
import { Box, Post, Roof } from './models/parts'
import { selectionId, type SelectionId } from './scene-types'

/** Road surface as one strip following the profile, with darker shoulders (vertex colours). */
function roadGeometry(road: Road) {
  const pos: number[] = []
  const col: number[] = []
  const idx: number[] = []
  const n = road.samples.length
  const lanes = [-1, -0.82, 0.82, 1]
  const shade = [0.72, 1, 1, 0.72]
  road.samples.forEach((s, i) => {
    const [tx, tz] = road.line.tangent(i / (n - 1))
    for (let k = 0; k < lanes.length; k++) {
      const o = (lanes[k]! * road.width) / 2
      pos.push(s.x - tz * o, s.y + 0.07, s.z + tx * o)
      col.push(shade[k]!, shade[k]!, shade[k]!)
    }
    if (i < n - 1) {
      for (let k = 0; k < lanes.length - 1; k++) {
        const a = i * 4 + k
        idx.push(a, a + 4, a + 1, a + 1, a + 4, a + 5)
      }
    }
  })
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/** Railing posts, rails and piers for every bridge span, as instance matrices. */
function bridgeParts(road: Road) {
  const d = new THREE.Object3D()
  const posts: THREE.Matrix4[] = []
  const piers: THREE.Matrix4[] = []
  const n = road.samples.length
  for (const [a, b] of bridgeSpans(road.samples)) {
    for (let i = a; i <= b; i++) {
      const s = road.samples[i]!
      const [tx, tz] = road.line.tangent(i / (n - 1))
      const yaw = Math.atan2(tx, tz)
      for (const side of [-1, 1]) {
        const o = (side * road.width) / 2
        d.position.set(s.x - tz * o, s.y + 0.6, s.z + tx * o)
        d.rotation.set(0, yaw, 0)
        d.scale.set(0.16, 1.1, 0.16)
        d.updateMatrix()
        posts.push(d.matrix.clone())
        if (i < b) {
          // Hand rail: a thin beam to the next post.
          d.position.set(s.x - tz * o, s.y + 1.12, s.z + tx * o)
          d.scale.set(0.1, 0.1, road.step * 1.02)
          d.position.addScaledVector(new THREE.Vector3(tx, 0, tz), road.step / 2)
          d.updateMatrix()
          posts.push(d.matrix.clone())
        }
      }
      const gap = s.y - s.ground
      if ((i - a) % 4 === 2 && gap > 1.2) {
        d.position.set(s.x, s.ground + gap / 2 - 0.2, s.z)
        d.rotation.set(0, yaw, 0)
        d.scale.set(road.width * 0.8, gap, 0.9)
        d.updateMatrix()
        piers.push(d.matrix.clone())
      }
    }
  }
  return { posts, piers }
}

function Instances({ matrices, color }: { matrices: THREE.Matrix4[]; color: string }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    matrices.forEach((x, i) => m.setMatrixAt(i, x))
    m.instanceMatrix.needsUpdate = true
    m.computeBoundingSphere()
  }, [matrices])
  if (matrices.length === 0) return null
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, matrices.length]} castShadow receiveShadow>
      <boxGeometry />
      <meshStandardMaterial color={color} roughness={0.85} />
    </instancedMesh>
  )
}

/** The bus shuttling between the regions' stops (timetable from lib/world/roads). */
function Bus({ road, stops, map, model, night }: { road: Road; stops: number[]; map: WorldMap; model: ModelAsset; night: boolean }) {
  const g = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    const b = busAt(stops, road.line.length, map.road.busSpeed, map.road.busDwell, clock.elapsedTime + 40)
    const [x, z] = road.line.at(b.t)
    const [tx, tz] = road.line.tangent(b.t)
    const side = b.forward ? 1 : -1
    // Drive on the right-hand lane of the direction of travel.
    const lx = x - tz * side * road.width * 0.22
    const lz = z + tx * side * road.width * 0.22
    if (!g.current) return
    g.current.position.set(lx, road.deckAt(b.t) + 0.05, lz)
    g.current.rotation.y = Math.atan2(tx * side, tz * side)
  })
  return (
    <group ref={g}>
      <Suspense fallback={null}>
        <StaticModel model={model} />
      </Suspense>
      {night && <pointLight position={[0, 1.2, 3.8]} intensity={10} distance={18} color="#fff1c8" />}
    </group>
  )
}

function BusStop({ stop, onSelect }: { stop: Civic; onSelect: (id: SelectionId) => void }) {
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onSelect(selectionId('bus', stop.regionId))
  }
  return (
    <group position={stop.position} rotation-y={stop.rotation} onClick={click}>
      {[-1.3, 1.3].map((x) => <Post key={x} at={[x, -0.6]} height={2.5} radius={0.06} color="#3d4a52" />)}
      <Roof at={[0, 2.6, -0.2]} width={3.2} depth={1.6} height={0.3} color="#2f6f78" />
      <Box at={[0, 0.5, -0.5]} size={[2.4, 0.08, 0.5]} color="#8a6b48" />
      <Post at={[2, 0.4]} height={2.6} radius={0.05} color="#3d4a52" />
      <Box at={[2, 2.6, 0.4]} size={[0.08, 0.6, 0.6]} color="#e2a92c" />
    </group>
  )
}

/** Road, bridges, bus stops and the bus. */
export function Roads({ road, busStops, map, bus, night, onSelect }: { road: Road; busStops: Civic[]; map: WorldMap; bus: ModelAsset; night: boolean; onSelect: (id: SelectionId) => void }) {
  const geometry = useMemo(() => roadGeometry(road), [road])
  const parts = useMemo(() => bridgeParts(road), [road])
  const stops = useMemo(() => busStops.map((s) => s.t), [busStops])
  return (
    <group>
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial vertexColors color="#b3a07e" roughness={0.95} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
      <Instances matrices={parts.posts} color="#7a5a3a" />
      <Instances matrices={parts.piers} color="#8d877c" />
      {busStops.map((s) => <BusStop key={s.regionId} stop={s} onSelect={onSelect} />)}
      {stops.length > 1 && <Bus road={road} stops={stops} map={map} model={bus} night={night} />}
    </group>
  )
}
