'use client'

import { useMemo, type RefObject } from 'react'
import * as THREE from 'three'

export interface Look {
  skin: string
  cloth: string
  pants: string
  hair: string
  hat: boolean
  long: boolean
  carry: boolean
  height: number
}

/** Limb joints the walker animates: hipL, hipR, kneeL, kneeR, shoulderL, shoulderR, elbowL, elbowR, torso, load. */
export type Joints = RefObject<(THREE.Object3D | null)[]>

const TORSO = new THREE.LatheGeometry(
  [[0.0, 0.0], [0.15, 0.0], [0.165, 0.08], [0.14, 0.22], [0.165, 0.38], [0.195, 0.5], [0.17, 0.56], [0.06, 0.6], [0.0, 0.6]].map(([r, y]) => new THREE.Vector2(r, y)),
  18,
)
const HAT = (() => {
  const g = new THREE.ConeGeometry(0.34, 0.22, 24, 3, true)
  const p = g.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < p.count; i++) {
    const a = Math.atan2(p.getZ(i), p.getX(i))
    const ridge = 1 + Math.sin(a * 24) * 0.012
    p.setXYZ(i, p.getX(i) * ridge, p.getY(i), p.getZ(i) * ridge)
  }
  g.computeVertexNormals()
  return g
})()

function useMats(look: Look) {
  return useMemo(() => {
    const m = (c: string, r = 0.85) => new THREE.MeshStandardMaterial({ color: c, roughness: r })
    return { skin: m(look.skin, 0.6), cloth: m(look.cloth), pants: m(look.pants), hair: m(look.hair, 0.55), dark: m('#1b1512', 0.4), hat: new THREE.MeshStandardMaterial({ color: '#e7d7a6', roughness: 0.9, side: THREE.DoubleSide }), wood: m('#7a5a36'), basket: m('#a07b48') }
  }, [look])
}

/** A stylised villager built from smooth primitives: two-segment limbs, a lathe-shaped torso, face, hair, nón lá. */
export function Person({ look, joints }: { look: Look; joints: Joints }) {
  const mat = useMats(look)
  const set = (i: number) => (el: THREE.Object3D | null) => void (joints.current[i] = el)
  const s = look.height / 1.68
  return (
    <group scale={s}>
      {[-0.095, 0.095].map((x, i) => (
        <group key={x} ref={set(i)} position={[x, 0.9, 0]}>
          <mesh position={[0, -0.22, 0]} material={look.long ? mat.cloth : mat.pants} castShadow>
            <capsuleGeometry args={[0.075, 0.34, 4, 10]} />
          </mesh>
          <group ref={set(i + 2)} position={[0, -0.45, 0]}>
            <mesh position={[0, -0.2, 0]} material={mat.pants} castShadow>
              <capsuleGeometry args={[0.058, 0.32, 4, 10]} />
            </mesh>
            <mesh position={[0, -0.42, 0.05]} material={mat.dark}>
              <boxGeometry args={[0.1, 0.06, 0.24]} />
            </mesh>
          </group>
        </group>
      ))}
      <group ref={set(8)} position={[0, 0.86, 0]}>
        <mesh geometry={TORSO} material={mat.cloth} castShadow />
        {look.long && (
          <mesh position={[0, -0.18, 0]} material={mat.cloth} castShadow>
            <cylinderGeometry args={[0.17, 0.24, 0.46, 16, 1, true]} />
          </mesh>
        )}
        {[-0.205, 0.205].map((x, i) => (
          <group key={x} ref={set(i + 4)} position={[x, 0.52, 0]} rotation-z={x > 0 ? 0.08 : -0.08}>
            <mesh position={[0, -0.15, 0]} material={mat.cloth} castShadow>
              <capsuleGeometry args={[0.052, 0.24, 4, 10]} />
            </mesh>
            <group ref={set(i + 6)} position={[0, -0.3, 0]}>
              <mesh position={[0, -0.13, 0]} material={mat.skin} castShadow>
                <capsuleGeometry args={[0.042, 0.22, 4, 10]} />
              </mesh>
              <mesh position={[0, -0.28, 0.01]} material={mat.skin}>
                <sphereGeometry args={[0.045, 10, 8]} />
              </mesh>
            </group>
          </group>
        ))}
        <mesh position={[0, 0.64, 0]} material={mat.skin}>
          <cylinderGeometry args={[0.045, 0.055, 0.09, 10]} />
        </mesh>
        <group position={[0, 0.78, 0]}>
          <mesh scale={[0.92, 1.06, 0.98]} material={mat.skin} castShadow>
            <sphereGeometry args={[0.112, 20, 16]} />
          </mesh>
          {[-0.038, 0.038].map((x) => (
            <mesh key={x} position={[x, 0.012, 0.098]} material={mat.dark}>
              <sphereGeometry args={[0.013, 8, 6]} />
            </mesh>
          ))}
          <mesh position={[0, -0.018, 0.108]} material={mat.skin}>
            <sphereGeometry args={[0.016, 8, 6]} />
          </mesh>
          {[-0.104, 0.104].map((x) => (
            <mesh key={x} position={[x, 0, 0]} scale={[0.5, 1, 0.8]} material={mat.skin}>
              <sphereGeometry args={[0.03, 8, 6]} />
            </mesh>
          ))}
          <mesh position={[0, 0.03, -0.012]} scale={[1.02, 0.95, 1.04]} material={mat.hair}>
            <sphereGeometry args={[0.118, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          </mesh>
          {look.long && (
            <mesh position={[0, 0.0, -0.13]} material={mat.hair}>
              <sphereGeometry args={[0.055, 12, 10]} />
            </mesh>
          )}
          {look.hat && <mesh geometry={HAT} material={mat.hat} position={[0, 0.16, 0]} castShadow />}
        </group>
        {look.carry && (
          <group ref={set(9)} position={[0, 0.56, 0]} rotation-y={Math.PI / 2}>
            <mesh rotation-z={Math.PI / 2} material={mat.wood} castShadow>
              <cylinderGeometry args={[0.018, 0.018, 1.7, 6]} />
            </mesh>
            {[-0.78, 0.78].map((x) => (
              <group key={x} position={[x, 0, 0]}>
                <mesh position={[0, -0.35, 0]} material={mat.wood}>
                  <cylinderGeometry args={[0.004, 0.004, 0.7, 3]} />
                </mesh>
                <mesh position={[0, -0.72, 0]} material={mat.basket} castShadow>
                  <cylinderGeometry args={[0.2, 0.15, 0.2, 14, 1, true]} />
                </mesh>
              </group>
            ))}
          </group>
        )}
      </group>
    </group>
  )
}

/** Pose for a walk cycle phase (radians) and stride amount 0–1. */
export function pose(joints: (THREE.Object3D | null)[], phase: number, stride: number, t: number) {
  const swing = Math.sin(phase) * 0.55 * stride
  const [hipL, hipR, kneeL, kneeR, shL, shR, elL, elR, torso, load] = joints
  if (hipL) hipL.rotation.x = swing
  if (hipR) hipR.rotation.x = -swing
  if (kneeL) kneeL.rotation.x = Math.max(0, -Math.sin(phase - 0.6)) * 0.9 * stride
  if (kneeR) kneeR.rotation.x = Math.max(0, Math.sin(phase - 0.6)) * 0.9 * stride
  if (shL) shL.rotation.x = -swing * 0.8
  if (shR) shR.rotation.x = swing * 0.8
  if (elL) elL.rotation.x = -0.25 - Math.max(0, swing) * 0.4
  if (elR) elR.rotation.x = -0.25 - Math.max(0, -swing) * 0.4
  if (torso) {
    torso.position.y = 0.86 + Math.abs(Math.cos(phase)) * 0.025 * stride + Math.sin(t * 1.3) * 0.004
    torso.rotation.y = Math.sin(phase) * 0.06 * stride
  }
  if (load) load.rotation.x = Math.sin(phase * 2) * 0.05 * stride
}
