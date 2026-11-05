'use client'

import { useEffect, useState } from 'react'
import * as THREE from 'three'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'
import type { HdriKey } from '@/lib/registry/keys'

/** CC0 Poly Haven HDRIs shipped as base64 modules by @pmndrs/assets; split into their own chunks. */
const LOADERS: Record<HdriKey, () => Promise<{ default: string }>> = {
  night: () => import('@pmndrs/assets/hdri/night.exr'),
  sunrise: () => import('@pmndrs/assets/hdri/sunrise.exr'),
  park: () => import('@pmndrs/assets/hdri/park.exr'),
  sunset: () => import('@pmndrs/assets/hdri/sunset.exr'),
  dawn: () => import('@pmndrs/assets/hdri/dawn.exr'),
  sky: () => import('@pmndrs/assets/hdri/sky.exr'),
  forest: () => import('@pmndrs/assets/hdri/forest.exr'),
}

const cache = new Map<HdriKey, Promise<THREE.Texture>>()

function load(key: HdriKey): Promise<THREE.Texture> {
  const hit = cache.get(key)
  if (hit) return hit
  const p = LOADERS[key]().then(
    (m) =>
      new Promise<THREE.Texture>((resolve, reject) => {
        new EXRLoader().load(m.default, (t) => {
          t.mapping = THREE.EquirectangularReflectionMapping
          resolve(t)
        }, undefined, reject)
      }),
  )
  cache.set(key, p)
  return p
}

/** The environment texture for a key (null while loading; the previous one stays until the new one is ready). */
export function useHdri(key: HdriKey): THREE.Texture | null {
  const [tex, setTex] = useState<THREE.Texture | null>(null)
  useEffect(() => {
    let alive = true
    load(key).then((t) => alive && setTex(t), () => undefined)
    return () => {
      alive = false
    }
  }, [key])
  return tex
}

/** Cloud sprite texture (CC0, @pmndrs/assets) as a data URL. */
export function useCloudTexture(): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    void import('@pmndrs/assets/textures/cloud.webp').then((m) => alive && setUrl(m.default))
    return () => {
      alive = false
    }
  }, [])
  return url
}
