'use client'

import type { ThreeEvent } from '@react-three/fiber'
import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import type { Region } from '@/lib/content/schema/world'
import { isWorldModelKey } from '@/lib/registry/keys'
import type { PlacedLandmark, Pos, Station, WorldLayout } from '@/lib/world/layout'
import { WORLD_MODELS } from './models/registry'
import { Box, Post, Roof } from './models/parts'
import { Lighthouse, Pier, Porch } from './models/scenery'
import { Label } from './label-portal'
import { useLabelVisible } from './label-declutter'
import { selectionId, type SelectionId } from './scene-types'

function StationModel({ station, night, label, onSelect }: { station: Station; night: boolean; label: boolean; onSelect: (id: SelectionId) => void }) {
  const [x, y, z] = station.position
  const rot = Math.atan2(station.tangent[0], station.tangent[1])
  const labelOk = useLabelVisible(`station:${station.id}`)
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onSelect(selectionId('station', station.id))
  }
  return (
    <group position={[x, y, z]} rotation-y={rot} onClick={click}>
      <group position={[4.2, 0, 0]}>
        <Box at={[0, 0.5, 0]} size={[4, 1, 22]} color="#a39a8a" />
        {[-7, 0, 7].map((pz) => <Post key={pz} at={[1.2, pz]} height={4.2} radius={0.15} color="#5a4a3a" />)}
        <group position={[0, 0, 0]}>
          <Roof at={[0.6, 4.8, 0]} width={4.4} depth={20} height={1.4} color="#5b6b7a" />
        </group>
        {night && <pointLight position={[0, 3.6, 0]} intensity={14} distance={22} color="#ffcf8a" />}
      </group>
      {label && labelOk && (
        <Label position={[4, 8, 0]} center zIndexRange={[10, 0]}>
          <button type="button" onClick={() => onSelect(selectionId('station', station.id))} className="pointer-events-auto whitespace-nowrap rounded-full border border-rule bg-paper/90 px-2 py-0.5 font-sans text-[11px] text-ink shadow-sm">
            {station.id.toUpperCase()}
            <span className="hidden sm:inline"> · {station.title}</span>
          </button>
        </Label>
      )}
    </group>
  )
}

/** Beyond this distance a landmark is drawn as one cheap block instead of dozens of small meshes. */
const DETAIL_RANGE = 240
const proxyGeometry = new THREE.BoxGeometry(1, 1, 1)
const proxyBody = new THREE.MeshStandardMaterial({ color: '#cbbfa8', roughness: 0.9 })
const proxyRoof = new THREE.MeshStandardMaterial({ color: '#9a5a44', roughness: 0.85 })

/** True while the camera is within `range` (with hysteresis, checked a few times a second — not every frame). */
function useNear(at: [number, number, number], range: number) {
  const [near, setNear] = useState(false)
  const t = useRef(0)
  useFrame(({ camera, clock }) => {
    if (clock.elapsedTime - t.current < 0.35) return
    t.current = clock.elapsedTime
    const d = Math.hypot(camera.position.x - at[0], camera.position.z - at[2])
    setNear((was) => (was ? d < range * 1.12 : d < range))
  })
  return near
}

function LandmarkModel({ placed, regions, night, onSelect }: { placed: PlacedLandmark; regions: Region[]; night: boolean; onSelect: (id: SelectionId) => void }) {
  const region = regions.find((r) => r.id === placed.regionId)
  const key = placed.landmark.model
  const near = useNear(placed.position, DETAIL_RANGE)
  if (!isWorldModelKey(key)) return null
  const Model = WORLD_MODELS[key]
  return (
    <group
      position={placed.position}
      rotation-y={placed.rotation}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(selectionId('landmark', placed.landmark.id))
      }}
    >
      {near ? (
        <Model night={night} wall={region?.palette.wall[0] ?? '#e6d9bd'} roof={region?.palette.roof[0] ?? '#a8543a'} />
      ) : (
        <group>
          <mesh geometry={proxyGeometry} material={proxyBody} position={[0, 4, 0]} scale={[11, 8, 9]} />
          <mesh geometry={proxyGeometry} material={proxyRoof} position={[0, 9, 0]} scale={[12.5, 2, 10.5]} />
        </group>
      )}
    </group>
  )
}

/** Pulsing ring + label over the selected place. */
export function SelectionMarker({ at, label }: { at: Pos; label: string }) {
  return (
    <group position={at}>
      <mesh position={[0, 0.4, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[9, 10, 48]} />
        <meshBasicMaterial color="#ffd36b" transparent opacity={0.8} toneMapped={false} />
      </mesh>
      <Label position={[0, 16, 0]} center zIndexRange={[20, 10]}>
        <span className="pointer-events-auto whitespace-nowrap rounded-full bg-ink px-2 py-0.5 font-sans text-xs text-paper shadow">{label}</span>
      </Label>
    </group>
  )
}

export function Places({ layout, regions, night, labels, onSelect }: { layout: WorldLayout; regions: Region[]; night: boolean; labels: boolean; onSelect: (id: SelectionId) => void }) {
  const regionWall = regions[regions.length - 1]?.palette
  return (
    <group>
      {layout.stations.map((s) => <StationModel key={s.id} station={s} night={night} label={labels} onSelect={onSelect} />)}
      {layout.landmarks.map((l) => <LandmarkModel key={l.landmark.id} placed={l} regions={regions} night={night} onSelect={onSelect} />)}
      {layout.features.map((f) => (
        <group
          key={f.id}
          position={f.position}
          onClick={(e) => {
            e.stopPropagation()
            onSelect(selectionId('feature', f.id))
          }}
        >
          {f.kind === 'lighthouse' && <Lighthouse night={night} />}
          {f.kind === 'porch' && <Porch night={night} wall={regionWall?.wall[0] ?? '#efe6d2'} roof={regionWall?.roof[0] ?? '#a8543a'} />}
          {f.kind === 'pier' && <Pier />}
        </group>
      ))}
    </group>
  )
}
