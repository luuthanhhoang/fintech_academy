'use client'

import type { ThreeEvent } from '@react-three/fiber'
import { useFrame } from '@react-three/fiber'
import { Suspense, useRef } from 'react'
import type * as THREE from 'three'
import type { Action, ModelAsset } from '@/lib/content/schema/assets'
import type { Civic } from '@/lib/world/layout'
import { Box, Post, Roof, Window } from './models/parts'
import { Character } from './assets/character'
import { selectionId, type SelectionId } from './scene-types'

/** Kids are animated only within this distance of the camera. */
const SEE_KIDS = 150

type Play = 'tag' | 'jump' | 'swing'

/** What each kind of play looks like: clip, and how the child moves around the yard. */
const PLAY_ACTION: Record<Play, Action> = { tag: 'run', jump: 'idle', swing: 'sit' }

function Kid({ model, scale, play, seed, active }: { model: ModelAsset; scale: number; play: Play; seed: number; active: boolean }) {
  const g = useRef<THREE.Group>(null)
  useFrame(({ clock, camera }) => {
    const el = g.current
    if (!el) return
    const world = el.parent?.position
    el.visible = active && (!world || camera.position.distanceToSquared(world) < SEE_KIDS ** 2)
    if (!el.visible) return
    const t = clock.elapsedTime + seed
    if (play === 'tag') {
      // Chasing round the yard: a circle with a wobble.
      const a = t * 0.9 + seed
      const r = 4.5 + Math.sin(t * 0.7 + seed) * 1.2
      el.position.set(Math.cos(a) * r, 0, 6 + Math.sin(a) * r)
      el.rotation.set(0, -a, 0)
    } else if (play === 'jump') {
      el.position.set(-4 + (seed % 3) * 1.4, Math.abs(Math.sin(t * 5)) * 0.35, 9)
      el.rotation.set(0, seed, 0)
    } else {
      // On a swing: pendulum under the top bar.
      const a = Math.sin(t * 1.8) * 0.6
      el.position.set(6.2 + (seed % 2) * 1.4, 2.0 - Math.cos(a) * 1.6, 9.5 + Math.sin(a) * 1.6)
      el.rotation.set(a, Math.PI, 0)
    }
  })
  return (
    <group ref={g}>
      <Suspense fallback={null}>
        <Character model={model} action={PLAY_ACTION[play]} scale={scale} active={active} />
      </Suspense>
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
function School({ school, kids, kidScale, kidCount, daylight, night, onSelect }: { school: Civic; kids: ModelAsset[]; kidScale: number; kidCount: number; daylight: number; night: boolean; onSelect: (id: SelectionId) => void }) {
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
      {Array.from({ length: kidCount }, (_, i) => (
        <Kid key={i} model={kids[i % kids.length]!} scale={kidScale} play={plays[i % plays.length]!} seed={i * 1.7 + 0.3} active={daylight > 0.3} />
      ))}
    </group>
  )
}

export function Schools({ schools, kids, kidScale, kidCount, daylight, night, onSelect }: {
  schools: Civic[]
  kids: ModelAsset[]
  kidScale: number
  /** Children per schoolyard (map.yaml civic.kids). */
  kidCount: number
  daylight: number
  night: boolean
  onSelect: (id: SelectionId) => void
}) {
  return (
    <group>
      {schools.map((s) => <School key={s.regionId} school={s} kids={kids} kidScale={kidScale} kidCount={kidCount} daylight={daylight} night={night} onSelect={onSelect} />)}
    </group>
  )
}
