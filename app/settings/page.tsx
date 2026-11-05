'use client'

import { WithCatalog } from '@/components/data/gate'
import { BackupPanel } from '@/components/settings/backup-panel'
import { TutorSettingsPanel } from '@/components/settings/tutor-settings'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { Card, PageTitle } from '@/components/ui/primitives'

export default function SettingsPage() {
  return (
    <>
      <PageTitle title="Cài đặt" en="Settings" />
      <div className="space-y-6 font-sans">
        <Card>
          <h2 className="font-serif text-xl font-semibold">Giao diện</h2>
          <div className="mt-3"><ThemeToggle /></div>
        </Card>
        <BackupPanel />
        <WithCatalog>{(catalog) => <TutorSettingsPanel catalog={catalog} />}</WithCatalog>
      </div>
    </>
  )
}
