/** Builds the hub list items for each practice kind from content (server side). */
import type { ContentBundle } from '@/lib/content/types'
import { lessonsUsing, tracksUsing, type PracticeKind } from '@/lib/content/usage'
import type { HubItem } from './item-list'

const HREF: Record<PracticeKind, string> = { simulators: '/simulators/', labs: '/labs/', cases: '/cases/', scenarios: '/scenarios/' }

export function hubItems(b: ContentBundle, kind: PracticeKind): Omit<HubItem, 'badge'>[] {
  const trackTitle = new Map(b.tracks.map((t) => [t.id, t.title.vi]))
  const list: { id: string; title: { vi: string }; summary: string }[] = b[kind]
  return list.map((x) => ({
    href: `${HREF[kind]}${x.id}/`,
    title: x.title.vi,
    summary: x.summary,
    tracks: tracksUsing(b.lessons, kind, x.id).map((id) => ({ id, title: trackTitle.get(id) ?? id })),
    usedIn: lessonsUsing(b.lessons, kind, x.id).map((l) => l.title.vi),
  }))
}
