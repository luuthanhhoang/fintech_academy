import type { Metadata } from 'next'
import { VillageEntry } from '@/components/village/village-entry'

export const metadata: Metadata = { title: { absolute: 'FinAI Academy — Làng học' }, description: 'Lộ trình học thành một ngôi làng 3D: tập trung theo chặng, ôn tập bên ao, công trình là mô phỏng và case.' }

/** The village is the home page: the learning world is the hub, everything else hangs off it. */
export default function HomePage() {
  return <VillageEntry />
}
