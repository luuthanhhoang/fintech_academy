'use client'

import Link from 'next/link'
import type { SiteConfig } from '@/lib/content/schema/config'
import { Icon } from '@/components/ui/icons'
import { Dialog } from './dialog'

export function MenuSheet({ site, open, onClose }: { site: SiteConfig; open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} label="Menu">
      <nav aria-label="Menu đầy đủ" className="grid grid-cols-2 gap-1 p-3">
        {site.nav.map((n) => (
          <Link key={n.href} href={n.href} onClick={onClose} className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-paper-2">
            <Icon name={n.icon} />
            {n.label}
          </Link>
        ))}
      </nav>
    </Dialog>
  )
}
