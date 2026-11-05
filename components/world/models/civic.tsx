'use client'

import { Box, House, Post, Roof, Window, type ModelProps } from './parts'

export function Bank({ night, wall, roof }: ModelProps) {
  return (
    <group>
      <Box at={[0, 0.4, 0]} size={[14, 0.8, 10]} color="#bdb6a6" />
      <Box at={[0, 3.6, -0.5]} size={[12, 5.6, 8]} color={wall} />
      {[-4.5, -1.5, 1.5, 4.5].map((x) => <Post key={x} at={[x, 4.3]} height={6.4} radius={0.45} color="#ece6d8" />)}
      <mesh position={[0, 7.6, 3.6]} rotation-z={Math.PI / 2} rotation-y={Math.PI / 2} castShadow>
        <cylinderGeometry args={[1.6, 1.6, 12.4, 3]} />
        <meshStandardMaterial color={roof} flatShading />
      </mesh>
      <Box at={[0, 7, -0.5]} size={[12.6, 1, 8.6]} color={roof} />
      <mesh position={[0, 9.4, 3.9]}>
        <cylinderGeometry args={[0.9, 0.9, 0.2, 24]} />
        <meshStandardMaterial color="#d8b23a" metalness={0.7} roughness={0.3} emissive={night ? '#b08a20' : '#000'} />
      </mesh>
      <Window at={[-3, 3.6, 3.52]} size={[1.6, 2]} night={night} />
      <Window at={[3, 3.6, 3.52]} size={[1.6, 2]} night={night} />
    </group>
  )
}

export function Granary({ night, roof }: ModelProps) {
  return (
    <group>
      {[[-3, -3], [3, -3], [-3, 3], [3, 3]].map(([x, z]) => <Post key={`${x}${z}`} at={[x!, z!]} height={2} radius={0.35} color="#6b4a2f" />)}
      <Box at={[0, 4, 0]} size={[8, 4, 8]} color="#9a7048" />
      <Roof at={[0, 8.2, 0]} width={11} depth={11} height={4.4} color={roof === '#a8543a' ? '#c9b37a' : '#c2ab6e'} />
      <Window at={[0, 4.4, 4.02]} size={[1.4, 1.4]} night={night} />
      {[-1.5, 0, 1.5].map((x) => (
        <mesh key={x} position={[x + 5, 0.6, 3]} castShadow>
          <sphereGeometry args={[0.7, 10, 8]} />
          <meshStandardMaterial color="#d8c89a" roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

export function CommunalHouse({ night, roof }: ModelProps) {
  return (
    <group>
      <Box at={[0, 0.5, 0]} size={[18, 1, 10]} color="#8e8676" />
      {[-7, -3.5, 0, 3.5, 7].flatMap((x) => [-3.5, 3.5].map((z) => <Post key={`${x}${z}`} at={[x, z]} height={5} radius={0.4} color="#8b2f23" />))}
      <Box at={[0, 3, -1]} size={[15, 4, 5]} color="#c9b48e" />
      <Roof at={[0, 7.4, 0]} width={23} depth={14} height={4.6} color={roof} />
      {[-11, 11].map((x) => (
        <mesh key={x} position={[x, 6.2, 0]} rotation-z={x > 0 ? -0.6 : 0.6}>
          <coneGeometry args={[0.5, 2.4, 6]} />
          <meshStandardMaterial color={roof} />
        </mesh>
      ))}
      <Window at={[0, 3, 1.52]} size={[3, 1.6]} night={night} />
    </group>
  )
}

const GOODS = ['#e05a3a', '#e8c547', '#7fb04a']
const AWNING = ['#c0392b', '#2f6db0', '#d9a441', '#3f8a5a', '#8e44ad', '#e67e22']

export function Market({ night }: ModelProps) {
  const stalls = [[-6, -4], [0, -4], [6, -4], [-6, 4], [0, 4], [6, 4]] as const
  return (
    <group>
      <Box at={[0, 0.1, 0]} size={[20, 0.2, 14]} color="#b8a888" />
      {stalls.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          {[[-1.6, -1.2], [1.6, -1.2], [-1.6, 1.2], [1.6, 1.2]].map(([px, pz]) => <Post key={`${px}${pz}`} at={[px!, pz!]} height={2.8} radius={0.1} color="#6b4a2f" />)}
          <Box at={[0, 2.9, 0]} size={[3.8, 0.15, 3]} color={AWNING[i % AWNING.length]!} />
          <Box at={[0, 0.9, 0]} size={[3, 0.8, 1.6]} color="#8a6a46" />
          {[-0.9, 0, 0.9].map((gx, k) => (
            <mesh key={gx} position={[gx, 1.5, 0]}>
              <sphereGeometry args={[0.32, 8, 6]} />
              <meshStandardMaterial color={GOODS[(i + k) % GOODS.length]!} />
            </mesh>
          ))}
          {night && <pointLight position={[0, 2.4, 0]} intensity={6} distance={9} color="#ffb347" />}
        </group>
      ))}
    </group>
  )
}

export function Watchtower({ night, roof }: ModelProps) {
  return (
    <group>
      {[[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]].map(([x, z]) => <Post key={`${x}${z}`} at={[x!, z!]} height={10} radius={0.22} color="#6b4a2f" />)}
      <Box at={[0, 10.2, 0]} size={[5, 0.3, 5]} color="#7a5a3a" />
      <Box at={[0, 11.4, 0]} size={[4, 2.2, 4]} color="#a88a62" />
      <Roof at={[0, 13.6, 0]} width={6} depth={6} height={2.4} color={roof} />
      <Window at={[0, 11.5, 2.02]} size={[1.6, 0.9]} night={night} />
    </group>
  )
}

export function Archive({ night, wall, roof }: ModelProps) {
  return (
    <group>
      <Box at={[0, 3.5, 0]} size={[10, 7, 8]} color={wall} />
      <Roof at={[0, 9, 0]} width={12.5} depth={10.5} height={4} color={roof} />
      {[-3, 0, 3].flatMap((x) => [2, 5].map((y) => <Window key={`${x}${y}`} at={[x, y, 4.02]} size={[1.4, 1.4]} night={night} />))}
    </group>
  )
}

export function Workshop({ night, wall, roof }: ModelProps) {
  return (
    <group>
      <House w={10} d={8} h={4} wall={wall} roof={roof} night={night} />
      <Box at={[3.5, 7.5, -2]} size={[1.2, 5, 1.2]} color="#7a6a5a" />
      <mesh position={[-6.5, 2.6, 0]} rotation-y={Math.PI / 2}>
        <torusGeometry args={[1.8, 0.35, 6, 12]} />
        <meshStandardMaterial color="#8a8f96" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  )
}
