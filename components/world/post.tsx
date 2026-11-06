'use client'

import { Bloom, BrightnessContrast, DepthOfField, EffectComposer, HueSaturation, N8AO, SMAA, Sharpness, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import type { JSX } from 'react'
import type { QualityPreset } from '@/lib/content/schema/graphics'
import type { BlendedLook } from '@/lib/world/looks'
import type { Pos } from '@/lib/world/layout'

/**
 * Post-processing chain: ambient occlusion → depth of field (close views) → bloom (sun, lamps, windows, moon)
 * → filmic AgX tone mapping → colour grade from the current look → vignette → SMAA.
 */
export function PostFX({ quality, look, focus }: { quality: QualityPreset; look: BlendedLook; focus: Pos | null }) {
  const effects = [
    quality.ao && <N8AO key="ao" aoRadius={3} distanceFalloff={1.2} intensity={2.2} quality={quality.id === 'cao' ? 'medium' : 'performance'} halfRes={quality.id !== 'cao'} color="#1a1410" />,
    quality.dof && focus && <DepthOfField key="dof" target={focus} focalLength={0.05} bokehScale={2.2} worldFocusRange={30} />,
    quality.bloom && <Bloom key="bloom" mipmapBlur luminanceThreshold={1.1} luminanceSmoothing={0.2} intensity={0.55} radius={0.7} />,
    <ToneMapping key="tm" mode={ToneMappingMode.NEUTRAL} />,
    <HueSaturation key="hs" saturation={look.saturation} />,
    <BrightnessContrast key="bc" contrast={look.contrast} />,
    <Vignette key="vig" offset={0.3} darkness={0.3} />,
    <SMAA key="smaa" />,
    <Sharpness key="sharp" sharpness={0.35} radius={1} />,
  ].filter((e): e is JSX.Element => Boolean(e))
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {effects}
    </EffectComposer>
  )
}
