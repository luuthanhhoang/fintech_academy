'use client'

import { useEffect, useState } from 'react'
import type { Lab } from '@/lib/content/schema/lab'
import { ErrorState, Skeleton } from '@/components/ui/states'
import { LabEmbed } from './lab-embed'

/** Loads full lab files (starter/tests/solution) emitted at build time, for client-only contexts like Today. */
export function LabEmbedById({ id }: { id: string }) {
  const [lab, setLab] = useState<Lab | null>(null)
  const [error, setError] = useState<Error | null>(null)
  useEffect(() => {
    fetch(`/generated/labs/${id}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<Lab>) : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setLab, (e: unknown) => setError(e instanceof Error ? e : new Error(String(e))))
  }, [id])
  if (error) return <ErrorState title="Không tải được lab" error={error} />
  if (!lab) return <Skeleton lines={3} />
  return <LabEmbed lab={lab} />
}
