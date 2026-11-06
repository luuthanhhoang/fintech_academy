import { LinkButton } from '@/components/ui/primitives'
import { EmptyState } from '@/components/ui/states'

export default function NotFound() {
  return <EmptyState title="Không tìm thấy trang" action={<LinkButton href="/">Về trang chủ</LinkButton>}>Đường dẫn có thể đã thay đổi. Thử tìm kiếm bằng Ctrl/⌘ + K.</EmptyState>
}
