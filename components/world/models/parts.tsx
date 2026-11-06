'use client'

import type { ReactNode } from 'react'
import { tinted } from '../materials'

export interface ModelProps {
  /** Night-time: windows and lamps glow. */
  night: boolean
  wall: string
  roof: string
}

type V3 = [number, number, number]

export function Box({ at, size, color, emissive, children }: { at: V3; size: V3; color: string; emissive?: string; children?: ReactNode }) {
  return (
    <mesh position={at} castShadow receiveShadow material={tinted('plaster', color, emissive)}>
      <boxGeometry args={size} />
      {children}
    </mesh>
  )
}

/** Four-sided hip roof (a 4-segment cone rotated to align with the walls). */
export function Roof({ at, width, depth, height, color }: { at: V3; width: number; depth: number; height: number; color: string }) {
  return (
    <mesh position={at} rotation-y={Math.PI / 4} scale={[width / Math.SQRT2, 1, depth / Math.SQRT2]} castShadow material={tinted('tiles', color)}>
      <coneGeometry args={[1, height, 4]} />
    </mesh>
  )
}

export function Post({ at, height, radius = 0.25, color }: { at: [number, number]; height: number; radius?: number; color: string }) {
  return (
    <mesh position={[at[0], height / 2, at[1]]} castShadow material={tinted('wood', color)}>
      <cylinderGeometry args={[radius, radius, height, 8]} />
    </mesh>
  )
}

/** A window pane that glows warm at night. */
export function Window({ at, size, night, rotY = 0 }: { at: V3; size: [number, number]; night: boolean; rotY?: number }) {
  return (
    <mesh position={at} rotation-y={rotY}>
      <planeGeometry args={size} />
      <meshStandardMaterial color={night ? '#ffd27a' : '#3a434a'} emissive={night ? '#ffb347' : '#000000'} emissiveIntensity={night ? 2 : 0} roughness={0.4} envMapIntensity={0.08} />
    </mesh>
  )
}

/** Simple gable house used for concept lots and as a base for several landmarks. */
export function House({ w, d, h, wall, roof, night }: { w: number; d: number; h: number } & ModelProps) {
  return (
    <group>
      <Box at={[0, h / 2, 0]} size={[w, h, d]} color={wall} />
      <Roof at={[0, h + h * 0.45, 0]} width={w * 1.25} depth={d * 1.25} height={h * 0.9} color={roof} />
      <Box at={[0, h * 0.35, d / 2 + 0.02]} size={[w * 0.2, h * 0.7, 0.05]} color="#5a3d26" />
      <Window at={[-w * 0.3, h * 0.55, d / 2 + 0.03]} size={[w * 0.18, h * 0.22]} night={night} />
      <Window at={[w * 0.3, h * 0.55, d / 2 + 0.03]} size={[w * 0.18, h * 0.22]} night={night} />
    </group>
  )
}
