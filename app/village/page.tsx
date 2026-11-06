'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'

/** Old URL (/village/?…) kept so existing links and bookmarks still land in the village (now the home page). */
function Redirect() {
  const router = useRouter()
  const q = useSearchParams().toString()
  useEffect(() => router.replace(q ? `/?${q}` : '/'), [router, q])
  return <p className="p-6 text-sm text-ink-3">Đang chuyển tới làng học…</p>
}

export default function VillageRedirect() {
  return (
    <Suspense>
      <Redirect />
    </Suspense>
  )
}
