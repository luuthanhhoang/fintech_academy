'use client'

import { Sparkles } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type * as THREE from 'three'
import type { Lot, Pos } from '@/lib/world/layout'
import type { Terrain } from '@/lib/world/terrain'

/** A water buffalo grazing beside a paddy (slow head bob, tail flick). */
function Buffalo({ at, rot, seed }: { at: Pos; rot: number; seed: number }) {
  const head = useRef<THREE.Group>(null)
  const tail = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed
    if (head.current) head.current.rotation.x = 0.35 + Math.sin(t * 0.6) * 0.25
    if (tail.current) tail.current.rotation.z = Math.sin(t * 2.3) * 0.4
  })
  const hide = '#3d3a38'
  return (
    <group position={at} rotation-y={rot}>
      <mesh position={[0, 1.15, 0]} rotation-x={Math.PI / 2} castShadow>
        <capsuleGeometry args={[0.55, 1.4, 6, 14]} />
        <meshStandardMaterial color={hide} roughness={0.7} />
      </mesh>
      {[[-0.32, 0.65], [0.32, 0.65], [-0.32, -0.65], [0.32, -0.65]].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x!, 0.45, z!]} castShadow>
          <cylinderGeometry args={[0.1, 0.09, 0.9, 8]} />
          <meshStandardMaterial color={hide} roughness={0.8} />
        </mesh>
      ))}
      <group ref={head} position={[0, 1.35, 1.15]}>
        <mesh position={[0, -0.1, 0.35]} scale={[0.8, 0.75, 1.2]} castShadow>
          <sphereGeometry args={[0.32, 14, 12]} />
          <meshStandardMaterial color={hide} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.2, 0.68]}>
          <sphereGeometry args={[0.16, 10, 8]} />
          <meshStandardMaterial color="#2a2726" roughness={0.5} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.32, 0.12, 0.25]} rotation={[0, 0, s * -0.3]}>
            <torusGeometry args={[0.32, 0.05, 6, 16, Math.PI * 0.9]} />
            <meshStandardMaterial color="#d8cbb0" roughness={0.6} />
          </mesh>
        ))}
      </group>
      <mesh ref={tail} position={[0, 1.2, -1.25]}>
        <cylinderGeometry args={[0.025, 0.02, 0.8, 4]} />
        <meshStandardMaterial color={hide} />
      </mesh>
    </group>
  )
}

/** Ducks paddling slow circles on a pond. */
function Ducks({ center, radius, surface }: { center: [number, number]; radius: number; surface: number }) {
  const g = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    g.current?.children.forEach((c, i) => {
      const a = clock.elapsedTime * 0.08 + i * 0.5
      const r = radius * 0.55 + Math.sin(i * 1.7) * radius * 0.15
      c.position.set(center[0] + Math.cos(a) * r - Math.cos(a) * i * 0.6, surface + 0.05 + Math.sin(clock.elapsedTime * 2 + i) * 0.03, center[1] + Math.sin(a) * r)
      c.rotation.y = -a + Math.PI
    })
  })
  return (
    <group ref={g}>
      {Array.from({ length: 7 }, (_, i) => (
        <group key={i} scale={i === 0 ? 1.2 : 0.9}>
          <mesh position={[0, 0.12, 0]} scale={[0.7, 0.55, 1]}>
            <sphereGeometry args={[0.28, 12, 10]} />
            <meshStandardMaterial color={i === 0 ? '#f4f1ea' : '#8a6a42'} roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.32, 0.2]}>
            <sphereGeometry args={[0.12, 10, 8]} />
            <meshStandardMaterial color={i === 0 ? '#f4f1ea' : '#3f5a3a'} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.3, 0.33]} rotation-x={Math.PI / 2}>
            <coneGeometry args={[0.04, 0.12, 6]} />
            <meshStandardMaterial color="#e89a2c" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** A V-shaped flock crossing the sky, wings flapping. */
function Flock({ seed, center, radius, height }: { seed: number; center: Pos; radius: number; height: number }) {
  const g = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.035 + seed
    if (!g.current) return
    g.current.position.set(center[0] + Math.cos(t) * radius, height + Math.sin(t * 3) * 6, center[2] + Math.sin(t) * radius)
    g.current.rotation.y = -t + Math.PI
    g.current.children.forEach((bird, i) => {
      const flap = Math.sin(clock.elapsedTime * 7 + i) * 0.6
      const [l, r] = bird.children
      if (l) l.rotation.z = flap
      if (r) r.rotation.z = -flap
    })
  })
  return (
    <group ref={g}>
      {Array.from({ length: 9 }, (_, i) => {
        const side = i % 2 ? 1 : -1
        const k = Math.ceil(i / 2)
        return (
          <group key={i} position={[side * k * 1.6, 0, -k * 1.4]}>
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * 0.45, 0, 0]}>
                <boxGeometry args={[0.9, 0.03, 0.28]} />
                <meshStandardMaterial color="#2b2b30" />
              </mesh>
            ))}
          </group>
        )
      })}
    </group>
  )
}

/** Animals and small life: buffaloes by paddies, ducks, birds by day; fireflies over fields and ponds at night. */
export function Wildlife({ terrain, lots, daylight, fireflies }: { terrain: Terrain; lots: Lot[]; daylight: number; fireflies: number }) {
  const pond = terrain.lakes.find((l) => l.kind === 'pond')
  const buffaloes = useMemo(
    () =>
      lots
        .filter((l, i) => l.plotKind === 'paddy' && i % 11 === 3)
        .map((l, i) => {
          const x = l.plot[0] + Math.cos(l.rotation) * 8
          const z = l.plot[2] - Math.sin(l.rotation) * 8
          return { at: [x, terrain.height(x, z), z] as Pos, rot: l.rotation + 1.2 + i, seed: i * 3 }
        }),
    [lots, terrain],
  )
  const center: Pos = pond ? [pond.center[0], 0, pond.center[1]] : [0, 0, 0]
  return (
    <group>
      {buffaloes.map((b, i) => <Buffalo key={i} {...b} />)}
      {pond && <Ducks center={pond.center} radius={pond.radius} surface={pond.surface} />}
      {daylight > 0.3 && [0, 2.1, 4.2].map((s) => <Flock key={s} seed={s} center={center} radius={180 + s * 40} height={70 + s * 8} />)}
      {daylight < 0.35 && fireflies > 0 && (
        <>
          {pond && <Sparkles position={[pond.center[0], pond.surface + 1.5, pond.center[1]]} scale={[pond.radius * 3, 3, pond.radius * 3]} count={Math.round(fireflies * 0.4)} size={6} speed={0.35} color="#e4ff8a" opacity={1} noise={1.5} />}
          {lots.filter((_, i) => i % 6 === 0).map((l) => (
            <Sparkles key={l.conceptId} position={[l.plot[0], l.plot[1] + 1.2, l.plot[2]]} scale={[14, 2.5, 10]} count={Math.round(fireflies / 30)} size={5} speed={0.3} color="#dfff7a" noise={1} />
          ))}
        </>
      )}
    </group>
  )
}
