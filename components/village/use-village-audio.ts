'use client'

import { useEffect, useRef, useState } from 'react'
import type { MusicPiece } from '@/lib/content/schema/world'
import { AudioEngine } from '@/lib/audio/engine'

export interface AudioPrefs { on: boolean; pieceId: string | null; master: number; music: number; ambience: number }

const DEFAULT: AudioPrefs = { on: false, pieceId: null, master: 0.8, music: 0.5, ambience: 0.7 }
const KEY = 'village:audio'

function loadPrefs(): AudioPrefs {
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? { ...DEFAULT, ...(JSON.parse(raw) as Partial<AudioPrefs>), on: false } : DEFAULT
  } catch {
    return DEFAULT
  }
}

/** Audio engine lifecycle: created on the first user gesture ("Bật âm thanh"), follows ambience and music. */
export function useVillageAudio(pieces: readonly MusicPiece[], ambience: Record<string, number>) {
  const engine = useRef<AudioEngine | null>(null)
  const [prefs, setPrefs] = useState<AudioPrefs>(DEFAULT)
  useEffect(() => {
    const id = window.setTimeout(() => setPrefs(loadPrefs()), 0)
    return () => window.clearTimeout(id)
  }, [])
  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(prefs))
    } catch {
      /* storage unavailable: preferences just are not remembered */
    }
  }, [prefs])
  useEffect(() => {
    const e = engine.current
    if (!e) return
    if (!prefs.on) {
      e.setAmbience({})
      e.playMusic(null)
      return
    }
    e.setVolumes(prefs)
    e.setAmbience(ambience)
  }, [prefs, ambience])
  useEffect(() => {
    const e = engine.current
    if (e && prefs.on) e.playMusic(pieces.find((p) => p.id === prefs.pieceId) ?? null)
  }, [prefs.on, prefs.pieceId, pieces])
  useEffect(() => () => engine.current?.dispose(), [])

  const toggle = async () => {
    if (!engine.current) engine.current = new AudioEngine()
    await engine.current.resume()
    setPrefs((p) => ({ ...p, on: !p.on }))
  }
  return {
    prefs,
    toggle,
    update: (patch: Partial<AudioPrefs>) => setPrefs((p) => ({ ...p, ...patch })),
    thunder: (d: number) => prefs.on && engine.current?.thunder(d),
    chime: () => prefs.on && engine.current?.chime(),
  }
}
