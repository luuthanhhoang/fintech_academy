'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '@/lib/db/dexie'
import { deleteNote, saveNote } from '@/lib/db/repos/activity'
import { Button } from '@/components/ui/primitives'
import { Skeleton } from '@/components/ui/states'

export function NotesPanel({ lessonId, anchors }: { lessonId: string; anchors: { slug: string; heading: string }[] }) {
  const notes = useLiveQuery(() => db().notes.where('lessonId').equals(lessonId).sortBy('updatedAt'), [lessonId])
  const [text, setText] = useState('')
  const [anchor, setAnchor] = useState('')
  const [editing, setEditing] = useState<string | null>(null)

  const submit = async () => {
    if (!text.trim()) return
    await saveNote(lessonId, anchor || null, text.trim(), editing ?? undefined)
    setText('')
    setEditing(null)
  }

  return (
    <section aria-labelledby="notes" className="mt-12 rounded-lg border border-rule p-4 font-sans sm:p-5">
      <h2 id="notes" className="font-serif text-xl font-semibold">
        Ghi chú cá nhân (Notes)
      </h2>
      <p className="mt-1 text-xs text-ink-3">Lưu trên trình duyệt này (IndexedDB). Sao lưu bằng Export trong Cài đặt.</p>
      <div className="mt-3 space-y-2">
        <select value={anchor} onChange={(e) => setAnchor(e.target.value)} aria-label="Gắn ghi chú vào mục" className="w-full rounded-md border border-rule bg-paper px-2 py-1.5 text-sm">
          <option value="">Cả bài</option>
          {anchors.map((a) => (
            <option key={a.slug} value={a.slug}>
              {a.heading}
            </option>
          ))}
        </select>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} aria-label="Nội dung ghi chú" placeholder="Điều mình rút ra, câu hỏi còn thắc mắc…" className="w-full rounded-md border border-rule bg-paper p-2 text-sm" />
        <div className="flex gap-2">
          <Button variant="primary" onClick={submit} disabled={!text.trim()}>
            {editing ? 'Cập nhật' : 'Lưu ghi chú'}
          </Button>
          {editing && (
            <Button variant="ghost" onClick={() => (setEditing(null), setText(''))}>
              Huỷ
            </Button>
          )}
        </div>
      </div>
      {notes === undefined ? (
        <Skeleton lines={2} className="mt-4" />
      ) : notes.length === 0 ? (
        <p className="mt-4 text-sm text-ink-3">Chưa có ghi chú nào cho bài này.</p>
      ) : (
        <ul className="mt-4 divide-y divide-rule">
          {notes.map((n) => (
            <li key={n.id} className="py-2 text-sm">
              {n.anchor && (
                <a href={`#${n.anchor}`} className="text-xs text-accent">
                  § {anchors.find((a) => a.slug === n.anchor)?.heading ?? n.anchor}
                </a>
              )}
              <p className="whitespace-pre-wrap">{n.text}</p>
              <div className="mt-1 flex gap-3 text-xs text-ink-3">
                <span>{n.updatedAt.toLocaleString('vi-VN')}</span>
                <button type="button" className="underline" onClick={() => (setEditing(n.id), setText(n.text), setAnchor(n.anchor ?? ''))}>
                  Sửa
                </button>
                <button type="button" className="text-bad underline" onClick={() => deleteNote(n.id)}>
                  Xoá
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
