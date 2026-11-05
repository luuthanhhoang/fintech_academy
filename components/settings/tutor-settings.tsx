'use client'

import { useState } from 'react'
import type { Catalog } from '@/lib/content/catalog'
import { forgetApiKey, saveTutorSettings, setApiKey, type TutorSettings } from '@/lib/tutor/settings'
import { useTutor, useTutorSettings } from '@/components/tutor/use-tutor'
import { Button, Card } from '@/components/ui/primitives'

export function TutorSettingsPanel({ catalog }: { catalog: Catalog }) {
  const { loaded, settings } = useTutorSettings()
  if (!loaded) return null
  const first = catalog.config.tutor.providers[0]
  const initial = settings ?? { enabled: false, providerId: first?.id ?? '', model: first?.models[0] ?? '', baseURL: '', keyStorage: 'session' as const }
  return <TutorSettingsForm catalog={catalog} initial={initial} />
}

function TutorSettingsForm({ catalog, initial }: { catalog: Catalog; initial: TutorSettings }) {
  const tutor = useTutor(catalog)
  const cfg = catalog.config.tutor
  const [draft, setDraft] = useState<TutorSettings>(initial)
  const [key, setKey] = useState('')
  const [saved, setSaved] = useState<string | null>(null)
  const preset = cfg.providers.find((p) => p.id === draft.providerId)
  const save = async () => {
    await saveTutorSettings(draft)
    if (key.trim()) await setApiKey(draft.keyStorage, key.trim())
    setKey('')
    setSaved('Đã lưu cài đặt gia sư.')
  }

  return (
    <Card>
      <h2 className="font-serif text-xl font-semibold">Gia sư AI (BYOK — tự mang API key)</h2>
      <p role="note" className="mt-2 rounded-md border border-warn bg-warn-soft p-3 text-sm">⚠ {cfg.keyWarning}</p>
      <label className="mt-4 flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} />
        Bật gia sư AI (tắt thì mọi tính năng khác vẫn hoạt động đầy đủ)
      </label>
      <fieldset disabled={!draft.enabled} className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          Nhà cung cấp
          <select value={draft.providerId} onChange={(e) => { const p = cfg.providers.find((x) => x.id === e.target.value); setDraft({ ...draft, providerId: e.target.value, model: p?.models[0] ?? '', baseURL: '' }) }} className="rounded-md border border-rule bg-paper px-2 py-1.5">
            {cfg.providers.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Model id
          <input list="model-presets" value={draft.model} onChange={(e) => setDraft({ ...draft, model: e.target.value })} placeholder="Nhập model id của nhà cung cấp" className="rounded-md border border-rule bg-paper px-2 py-1.5" />
          <datalist id="model-presets">{preset?.models.map((m) => <option key={m} value={m} />)}</datalist>
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          Base URL (để trống dùng mặc định{preset?.baseURL ? `: ${preset.baseURL}` : ''})
          <input value={draft.baseURL} onChange={(e) => setDraft({ ...draft, baseURL: e.target.value })} placeholder="https://…" className="rounded-md border border-rule bg-paper px-2 py-1.5" />
        </label>
        <label className="flex flex-col gap-1">
          API key
          <input type="password" autoComplete="off" value={key} onChange={(e) => setKey(e.target.value)} placeholder={tutor.status === 'ready' ? '•••• đã có key (nhập để thay)' : 'Dán API key'} className="rounded-md border border-rule bg-paper px-2 py-1.5" />
        </label>
        <label className="flex flex-col gap-1">
          Lưu key ở đâu
          <select value={draft.keyStorage} onChange={(e) => setDraft({ ...draft, keyStorage: e.target.value as TutorSettings['keyStorage'] })} className="rounded-md border border-rule bg-paper px-2 py-1.5">
            <option value="session">Chỉ trong phiên (mất khi tải lại trang)</option>
            <option value="indexeddb">Lưu trên trình duyệt (IndexedDB)</option>
          </select>
        </label>
      </fieldset>
      {preset && <p className="mt-3 text-xs text-ink-3">{preset.browserNote} <a className="text-accent underline" href={preset.docsUrl} target="_blank" rel="noreferrer">Tài liệu API</a></p>}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="primary" onClick={save}>Lưu</Button>
        <Button variant="danger" onClick={() => forgetApiKey().then(() => setSaved('Đã xoá API key.'))}>Xoá API key</Button>
        <span className="text-xs text-ink-3">Trạng thái: {tutor.status === 'ready' ? `sẵn sàng (${tutor.providerLabel} · ${tutor.model})` : tutor.status === 'needs-key' ? 'thiếu key hoặc model' : tutor.status === 'disabled' ? 'đang tắt' : 'đang tải'}</span>
      </div>
      {saved && <p role="status" className="mt-2 text-sm text-good">{saved}</p>}
    </Card>
  )
}
