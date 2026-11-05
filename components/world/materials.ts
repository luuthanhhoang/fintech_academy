'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { bricks, plaster, roofTiles, thatch, wood, type Pixels } from '@/lib/world/texture-data'

function toTexture(p: Pixels, repeat: [number, number] = [1, 1]): THREE.DataTexture {
  const t = new THREE.DataTexture(p.data, p.width, p.height, THREE.RGBAFormat)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(...repeat)
  t.magFilter = THREE.LinearFilter
  t.minFilter = THREE.LinearMipmapLinearFilter
  t.generateMipmaps = true
  t.anisotropy = 4
  t.needsUpdate = true
  return t
}

export interface VillageMaterials {
  plaster: THREE.MeshStandardMaterial
  tiles: THREE.MeshStandardMaterial
  wood: THREE.MeshStandardMaterial
  brick: THREE.MeshStandardMaterial
  thatch: THREE.MeshStandardMaterial
  stone: THREE.MeshStandardMaterial
  glass: THREE.MeshStandardMaterial
}

let shared: VillageMaterials | null = null

function createMaterials(): VillageMaterials {
  return {
      plaster: new THREE.MeshStandardMaterial({ map: toTexture(plaster(256, 11)), roughness: 0.93 }),
      tiles: new THREE.MeshStandardMaterial({ map: toTexture(roofTiles(256, 12)), roughness: 0.7, side: THREE.DoubleSide }),
      wood: new THREE.MeshStandardMaterial({ map: toTexture(wood(256, 13)), color: '#7a5636', roughness: 0.8 }),
      brick: new THREE.MeshStandardMaterial({ map: toTexture(bricks(256, 14), [2, 2]), color: '#b98a6e', roughness: 0.9 }),
      thatch: new THREE.MeshStandardMaterial({ map: toTexture(thatch(256, 15)), color: '#c9a95e', roughness: 1, side: THREE.DoubleSide }),
      stone: new THREE.MeshStandardMaterial({ map: toTexture(plaster(256, 16)), color: '#9a958a', roughness: 0.95 }),
      glass: new THREE.MeshStandardMaterial({ color: '#2a3238', roughness: 0.15, metalness: 0.2, emissive: '#ffb347', emissiveIntensity: 0 }),
  }
}

/** Shared materials, created once per page (procedural textures are not cheap). */
export function getVillageMaterials(): VillageMaterials {
  shared ??= createMaterials()
  return shared
}

/** Textured materials shared by houses and landmarks. */
export function useVillageMaterials(): VillageMaterials {
  return useMemo(() => getVillageMaterials(), [])
}

const tintCache = new Map<string, THREE.MeshStandardMaterial>()

/** A shared textured material tinted with a colour (cached per kind + colour). */
export function tinted(kind: 'plaster' | 'tiles' | 'wood' | 'stone', color: string, emissive?: string): THREE.MeshStandardMaterial {
  const key = `${kind}|${color}|${emissive ?? ''}`
  const hit = tintCache.get(key)
  if (hit) return hit
  const m = getVillageMaterials()[kind].clone()
  m.color = new THREE.Color(color)
  if (emissive) {
    m.emissive = new THREE.Color(emissive)
    m.emissiveIntensity = 1.4
  }
  tintCache.set(key, m)
  return m
}
