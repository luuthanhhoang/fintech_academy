import type { Metadata } from 'next'
import { getContent } from '@/lib/content/server'
import { HomeClient } from './home-client'

export function generateMetadata(): Metadata {
  const { site } = getContent().config
  return { title: { absolute: site.name }, description: site.tagline }
}

/** Home: what to study now (continue, due cards, today's plan) and the three tracks. */
export default function HomePage() {
  return <HomeClient />
}
