'use client'

import { PerformanceMonitor } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    /** Render statistics for debugging/measuring (draw calls and triangles per frame, rough FPS). */
    __village?: { calls: number; triangles: number; geometries: number; textures: number; fps: number }
  }
}

/**
 * Watches the frame rate and asks for a lower quality preset when it stays low (the user can still raise it by hand).
 * Bounds are in frames per second; `flipflops` limits how often it may oscillate before it gives up.
 */
export function PerfGovernor({ onDecline }: { onDecline: () => void }) {
  return <PerformanceMonitor bounds={() => [26, 50]} flipflops={2} onDecline={onDecline} />
}

/** Publishes renderer statistics once a second to window.__village. */
export function StatsProbe() {
  const frames = useRef(0)
  const t0 = useRef(0)
  const { gl } = useThree()
  // The post-processing chain renders several passes per frame; accumulate across them and reset once per frame.
  useEffect(() => {
    gl.info.autoReset = false
    return () => {
      gl.info.autoReset = true
    }
  }, [gl])
  useFrame(({ clock }) => {
    frames.current++
    const i = gl.info
    const now = clock.elapsedTime
    if (now - t0.current >= 1 && i.render.calls > 0) {
      window.__village = { calls: i.render.calls, triangles: i.render.triangles, geometries: i.memory.geometries, textures: i.memory.textures, fps: Math.round(frames.current / (now - t0.current)) }
      frames.current = 0
      t0.current = now
    }
    i.reset()
  })
  return null
}
