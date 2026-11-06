'use client'

import type { ThreeEvent } from '@react-three/fiber'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type * as THREE from 'three'
import type { WorldMap } from '@/lib/content/schema/world'
import { mulberry32 } from '@/lib/finance/random'
import type { Civic } from '@/lib/world/layout'
import { Box, Post, Roof, Window } from './models/parts'
import { Person, pose, type Look } from './person'
import { selectionId, type SelectionId } from './scene-types'

/** Kids are animated only within this distance of the camera. */
const SEE_KIDS = 150

type Play = 'tag' | 'jump' | 'swing'

function Kid({ look, play, seed, active }: { look: Look; play: Play; seed: number; active: boolean }) {
  const g = useRef<THREE.Group>(null)
  const joints = useRef<(THREE.Object3D | null)[]>([])
  useFrame(({ clock, camera }) => {
    const el = g.current
    if (!el) return
    const world = el.parent?.position
    el.visible = active && (!world || camera.position.distanceToSquared(world) < SEE_KIDS ** 2)
    if (!el.visible) return
    const t = clock.elapsedTime + seed
    if (play === 'tag') {
      // Chasing round the yard: a circle with a wobble, running stride.
      const a = t * 0.9 + seed
      const r = 4.5 + Math.sin(t * 0.7 + seed) * 1.2
      el.position.set(Math.cos(a) * r, 0, 6 + Math.sin(a) * r)
      el.rotation.y = -a
      pose(joints.current, t * 12, 1, t)
    } else if (play === 'jump') {
      el.position.set(-4 + (seed % 3) * 1.4, Math.abs(Math.sin(t * 5)) * 0.35, 9)
      el.rotation.y = seed
      pose(joints.current, 0, 0, t)
    } else {
      // On a swing: pendulum around the top bar.
      const a = Math.sin(t * 1.8) * 0.6
      el.position.set(6.2 + (seed % 2) * 1.4, 2.6 - Math.cos(a) * 2.1, 9.5 + Math.sin(a) * 2.1)
      el.rotation.set(a, Math.PI, 0)
      pose(joints.current, 0, 0, t)
    }
  })
  return (
    <group ref={g}>
      <Person look={look} joints={joints} />
    </group>
  )
}

function Playground() {
  return (
    <group>
      {/* Swing frame. */}
      {[[5.4, 9.5], [8.4, 9.5]].map(([x, z]) => <Post key={x} at={[x!, z!]} height={2.8} radius={0.07} color="#c0423a" />)}
      <mesh position={[6.9, 2.8, 9.5]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.07, 0.07, 3.2, 8]} />
        <meshStandardMaterial color="#c0423a" />
      </mesh>
      {/* Slide. */}
      <Box at={[-7, 1, 3]} size={[1.2, 2, 1.2]} color="#3f7fb8" />
      <mesh position={[-7, 1, 5]} rotation-x={-0.75}>
        <boxGeometry args={[0.9, 0.08, 3]} />
        <meshStandardMaterial color="#f2c230" roughness={0.4} />
      </mesh>
      {/* Seesaw. */}
      <Box at={[0, 0.3, 12.5]} size={[0.3, 0.6, 0.3]} color="#555" />
      <Box at={[0, 0.65, 12.5]} size={[4, 0.12, 0.35]} color="#3f9a5a" />
    </group>
  )
}

function Flag() {
  const flag = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (flag.current) flag.current.rotation.y = Math.sin(clock.elapsedTime * 2.2) * 0.25
  })
  return (
    <group position={[-9.5, 0, 5]}>
      <Post at={[0, 0]} height={8} radius={0.06} color="#d9d4c8" />
      <mesh ref={flag} position={[0.75, 7.4, 0]}>
        <planeGeometry args={[1.5, 1]} />
        <meshStandardMaterial color="#d8322a" side={2} roughness={0.8} />
      </mesh>
    </group>
  )
}

/** The region's school: a two-storey yellow schoolhouse, a flag, a yard and children playing by day. */
function School({ school, looks, daylight, night, onSelect }: { school: Civic; looks: Look[]; daylight: number; night: boolean; onSelect: (id: SelectionId) => void }) {
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onSelect(selectionId('school', school.regionId))
  }
  const plays: Play[] = ['tag', 'tag', 'tag', 'jump', 'jump', 'swing', 'swing', 'tag']
  return (
    <group position={school.position} rotation-y={school.rotation}>
      <group onClick={click}>
        <Box at={[0, 0.15, 6]} size={[20, 0.3, 14]} color="#cfc4ad" />
        <Box at={[0, 3.2, -3]} size={[18, 6.4, 6]} color="#f0c75a" />
        <Box at={[0, 3.2, 0.2]} size={[18, 0.25, 0.6]} color="#e8e0cc" />
        <Roof at={[0, 7.6, -3]} width={21} depth={8.6} height={2.6} color="#b8503a" />
        {[-7, -3.5, 0, 3.5, 7].flatMap((x) => [1.6, 4.8].map((y) => <Window key={`${x}:${y}`} at={[x, y, 0.02]} size={[1.6, 1.4]} night={night} />))}
        <Box at={[0, 5.9, 0.08]} size={[5, 0.7, 0.1]} color="#2f6f78" />
      </group>
      <Flag />
      <Playground />
      {looks.map((look, i) => <Kid key={i} look={look} play={plays[i % plays.length]!} seed={i * 1.7 + 0.3} active={daylight > 0.3} />)}
    </group>
  )
}

export function Schools({ schools, map, daylight, night, onSelect }: { schools: Civic[]; map: WorldMap; daylight: number; night: boolean; onSelect: (id: SelectionId) => void }) {
  const looks = useMemo(() => {
    const rand = mulberry32(map.seed + 31)
    const at = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)]!
    return Array.from({ length: map.civic.kids }, () => ({
      skin: at(map.people.skin), cloth: at(map.people.clothes), pants: at(map.people.clothes), hair: at(map.people.hair),
      hat: false, long: rand() < 0.4, carry: false, height: 1.05 + rand() * 0.25,
    }))
  }, [map])
  return (
    <group>
      {schools.map((s) => <School key={s.regionId} school={s} looks={looks} daylight={daylight} night={night} onSelect={onSelect} />)}
    </group>
  )
}
