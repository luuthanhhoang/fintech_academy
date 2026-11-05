import { getContent } from '@/lib/content/server'
import { Card, PageTitle } from '@/components/ui/primitives'

export const metadata = { title: 'Giới thiệu' }

export default function AboutPage() {
  const { site } = getContent().config
  return (
    <>
      <PageTitle title="Giới thiệu" en="About" lead={site.tagline} />
      <div className="space-y-4 font-sans text-sm leading-relaxed">
        <Card>
          <h2 className="font-serif text-xl font-semibold">Tuyên bố</h2>
          <p className="mt-2 font-medium">{site.disclaimer}</p>
        </Card>
        <Card>
          <h2 className="font-serif text-xl font-semibold">Dữ liệu được xử lý thế nào</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Site hoàn toàn tĩnh; không có máy chủ, không đăng nhập. Tiến độ, thẻ ôn, ghi chú lưu trong IndexedDB của trình duyệt.</li>
            <li>Số liệu thật luôn kèm nguồn và ngày kiểm tra; mục chưa kiểm chứng hiển thị nhãn “Cần kiểm chứng” và không nêu con số.</li>
            <li>Dữ liệu mô phỏng luôn có nhãn “{site.syntheticLabel}”.</li>
            <li>Điểm thành thạo chỉ tính từ kết quả quiz và ôn tập thật của bạn.</li>
            <li>Gia sư AI là tuỳ chọn (BYOK); key không bao giờ rời trình duyệt ngoài việc gửi thẳng tới nhà cung cấp bạn chọn.</li>
          </ul>
        </Card>
        <Card>
          <h2 className="font-serif text-xl font-semibold">Ngoài phạm vi</h2>
          <p className="mt-2">Backend, đăng nhập, dữ liệu thị trường realtime, bản tin thị trường hằng ngày, giao dịch thật, tư vấn đầu tư.</p>
        </Card>
      </div>
    </>
  )
}
