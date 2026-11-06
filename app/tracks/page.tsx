import { getContent } from '@/lib/content/server'
import { PageTitle } from '@/components/ui/primitives'
import { TracksClient } from './client'

export const metadata = { title: 'Lộ trình' }

export default function TracksPage() {
  const { tracks } = getContent()
  return (
    <>
      <PageTitle
        title="Lộ trình"
        lead={`${tracks.length} tuyến học, mỗi tuyến là một đường tàu: mỗi ga là một chặng kiến thức, dừng ở ga nào thì học bài ở ga đó. Chấm tròn đầy dần theo số bài bạn đã học xong.`}
      />
      <TracksClient />
    </>
  )
}
