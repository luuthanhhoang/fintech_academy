'use client'

import { useState } from 'react'
import { clearAllData, exportBackup, importBackup, type ImportMode } from '@/lib/db/backup'
import { Button, Card } from '@/components/ui/primitives'

export function BackupPanel() {
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [mode, setMode] = useState<ImportMode>('merge')

  const doExport = async () => {
    const json = await exportBackup()
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `finai-academy-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage({ ok: true, text: 'Đã xuất file sao lưu (không bao gồm API key).' })
  }

  const doImport = async (file: File) => {
    const r = await importBackup(await file.text(), mode)
    setMessage(r.ok ? { ok: true, text: `Đã nhập: ${Object.entries(r.counts).map(([k, v]) => `${k} ${v}`).join(', ')}` } : { ok: false, text: r.error })
  }

  const doClear = async () => {
    if (!window.confirm('Xoá TOÀN BỘ dữ liệu học tập và API key trên trình duyệt này? Không thể hoàn tác (trừ khi bạn có file sao lưu).')) return
    await clearAllData()
    setMessage({ ok: true, text: 'Đã xoá toàn bộ dữ liệu.' })
  }

  return (
    <Card>
      <h2 className="font-serif text-xl font-semibold">Sao lưu & khôi phục (Export / Import JSON)</h2>
      <p className="mt-1 text-sm text-ink-2">Tiến độ, thẻ ôn, lịch sử, ghi chú, cài đặt chỉ lưu trên trình duyệt này. Xuất file định kỳ để không mất dữ liệu.</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="primary" onClick={doExport}>Xuất JSON</Button>
        <label className="flex items-center gap-2 text-sm">
          Chế độ nhập
          <select value={mode} onChange={(e) => setMode(e.target.value as ImportMode)} className="rounded-md border border-rule bg-paper px-2 py-1">
            <option value="merge">Gộp (ghi đè theo khoá)</option>
            <option value="replace">Thay thế toàn bộ</option>
          </select>
        </label>
        <label className="cursor-pointer rounded-md border border-rule px-3 py-1.5 text-sm hover:bg-paper-2">
          Nhập JSON…
          <input type="file" accept="application/json,.json" className="sr-only" onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />
        </label>
        <Button variant="danger" onClick={doClear}>Xoá toàn bộ dữ liệu</Button>
      </div>
      {message && <p role="status" className={`mt-3 text-sm ${message.ok ? 'text-good' : 'text-bad'}`}>{message.text}</p>}
    </Card>
  )
}
