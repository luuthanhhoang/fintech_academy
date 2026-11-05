import type { Metadata } from 'next'
import { VillageEntry } from '@/components/village/village-entry'

export const metadata: Metadata = { title: 'Làng học', description: 'Lộ trình học thành một ngôi làng 3D: tập trung theo chặng, ôn tập bên ao, công trình là mô phỏng và case.' }

export default function VillagePage() {
  return <VillageEntry />
}
