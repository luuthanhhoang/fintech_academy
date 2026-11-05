'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type * as THREE from 'three'
import { Box, House, Post, Roof, type ModelProps } from './parts'

export function Orchard({ roof }: ModelProps) {
  const crowns = ['#4f8a3a', '#d9792b', '#7aa83f', '#b8442f', '#e0b23a', '#5f9a42']
  return (
    <group>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2
        return <Post key={i} at={[Math.cos(a) * 9, Math.sin(a) * 9]} height={1.2} radius={0.12} color="#8a6a46" />
      })}
      {crowns.map((c, i) => {
        const x = ((i % 3) - 1) * 4.5
        const z = (Math.floor(i / 3) - 0.5) * 6
        return (
          <group key={i} position={[x, 0, z]}>
            <Post at={[0, 0]} height={2.2} radius={0.2} color="#6b4a2f" />
            <mesh position={[0, 3.2, 0]} castShadow>
              <icosahedronGeometry args={[1.6, 1]} />
              <meshStandardMaterial color={c} roughness={0.9} flatShading />
            </mesh>
          </group>
        )
      })}
      <Roof at={[0, 2.5, -9]} width={4} depth={3} height={1.6} color={roof} />
    </group>
  )
}

export function Watermill({ night, wall, roof }: ModelProps) {
  const wheel = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (wheel.current) wheel.current.rotation.x += dt * 0.6
  })
  return (
    <group>
      <House w={9} d={7} h={5} wall={wall} roof={roof} night={night} />
      <group ref={wheel} position={[5.4, 3.2, 0]}>
        <mesh rotation-y={Math.PI / 2}>
          <torusGeometry args={[3, 0.25, 6, 24]} />
          <meshStandardMaterial color="#6b4a2f" />
        </mesh>
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} rotation-x={(i / 8) * Math.PI}>
            <boxGeometry args={[0.6, 6, 0.4]} />
            <meshStandardMaterial color="#7a5a3a" />
          </mesh>
        ))}
      </group>
    </group>
  )
}

export function Ruin() {
  const blocks: [number, number, number, number][] = [[-3, 0, 2, 0.3], [2.5, 0, -1, 0.9], [0, 0, -3.5, 1.4], [3.5, 0, 3, 2.1]]
  return (
    <group>
      <Box at={[0, 0.3, 0]} size={[12, 0.6, 10]} color="#8d8a82" />
      {[[-4, -3, 5.5], [-4, 3, 3], [4, -3, 4.2], [4, 3, 1.6]].map(([x, z, h]) => <Post key={`${x}${z}`} at={[x!, z!]} height={h!} radius={0.6} color="#a9a59a" />)}
      {blocks.map(([x, , z, r]) => (
        <mesh key={`${x}${z}`} position={[x, 0.9, z]} rotation={[r, r * 0.7, 0]} castShadow>
          <boxGeometry args={[1.8, 1, 1.2]} />
          <meshStandardMaterial color="#9a978c" roughness={1} />
        </mesh>
      ))}
      <mesh position={[-1, 0.62, 1]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[2.6, 12]} />
        <meshStandardMaterial color="#5f7a3e" />
      </mesh>
    </group>
  )
}

export function SignalTower({ night }: ModelProps) {
  const lamp = useRef<THREE.MeshStandardMaterial>(null)
  useFrame(({ clock }) => {
    if (lamp.current) lamp.current.emissiveIntensity = Math.sin(clock.elapsedTime * 3) > 0 ? 3 : 0.2
  })
  return (
    <group>
      {[[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x! * 0.6, 7, z! * 0.6]} rotation={[z! * 0.04, 0, -x! * 0.04]} castShadow>
          <cylinderGeometry args={[0.12, 0.18, 14, 6]} />
          <meshStandardMaterial color="#9aa3ad" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      {[3, 6, 9, 12].map((y) => <Box key={y} at={[0, y, 0]} size={[2.4 - y * 0.08, 0.15, 2.4 - y * 0.08]} color="#8a939c" />)}
      <mesh position={[0, 14.6, 0]}>
        <sphereGeometry args={[0.6, 12, 10]} />
        <meshStandardMaterial ref={lamp} color="#ff4d3a" emissive="#ff2a1a" emissiveIntensity={1} />
      </mesh>
      <House w={5} d={4} h={3} wall="#d9d2c3" roof="#4f6157" night={night} />
    </group>
  )
}

export function Lighthouse({ night }: { night: boolean }) {
  const beam = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (beam.current) beam.current.rotation.y += dt * 0.8
  })
  return (
    <group>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[0, 2 + i * 3.4, 0]} castShadow>
          <cylinderGeometry args={[2.4 - i * 0.25, 2.6 - i * 0.25, 3.4, 16]} />
          <meshStandardMaterial color={i % 2 ? '#c0392b' : '#f2efe6'} roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, 19.4, 0]}>
        <cylinderGeometry args={[1.3, 1.3, 2, 12]} />
        <meshStandardMaterial color="#fff3c4" emissive="#ffd36b" emissiveIntensity={night ? 3 : 0.3} />
      </mesh>
      <Roof at={[0, 21.4, 0]} width={3.6} depth={3.6} height={2} color="#2b2b2b" />
      {night && (
        <group ref={beam} position={[0, 19.4, 0]}>
          <mesh position={[0, 0, 40]} rotation-x={-Math.PI / 2}>
            <coneGeometry args={[7, 80, 24, 1, true]} />
            <meshBasicMaterial color="#fff2c0" transparent opacity={0.12} depthWrite={false} />
          </mesh>
          <pointLight intensity={30} distance={80} color="#ffe2a0" />
        </group>
      )}
    </group>
  )
}

export function Porch({ night, wall, roof }: ModelProps) {
  return (
    <group>
      <House w={9} d={7} h={4} wall={wall} roof={roof} night={night} />
      <Box at={[0, 0.3, 6]} size={[9, 0.3, 5]} color="#8a6a46" />
      {[-4, 4].map((x) => <Post key={x} at={[x, 8.2]} height={3.4} radius={0.15} color="#6b4a2f" />)}
      <mesh position={[0, 3.6, 6.4]} rotation-x={0.25} castShadow>
        <boxGeometry args={[10, 0.2, 5.4]} />
        <meshStandardMaterial color="#b08a5e" emissive="#3a2a1a" emissiveIntensity={0.6} />
      </mesh>
      <Box at={[0, 0.9, 7.2]} size={[3, 0.2, 1]} color="#5a3d26" />
    </group>
  )
}

export function Pier() {
  return (
    <group>
      <Box at={[0, 0.6, 5]} size={[2.2, 0.2, 12]} color="#8a6a46" />
      {[0, 4, 8].flatMap((z) => [-1, 1].map((x) => <Post key={`${x}${z}`} at={[x, z]} height={1.2} radius={0.12} color="#5a3d26" />))}
    </group>
  )
}
