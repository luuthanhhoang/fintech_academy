# FinAI Academy — Hướng dẫn cho Claude Code

Website học cá nhân (chỉ FE, static export, deploy Vercel) cho 2 lộ trình: Fintech từ 0 và AI/LLM engineer.

## NGUYÊN TẮC BẮT BUỘC (không có ngoại lệ)
1. **Không hardcode**, không fix cứng keyword/query/danh sách. Bài học, khái niệm, quiz, quan hệ tiền đề, cấu hình lộ trình,
   danh sách simulator, từ khóa tìm kiếm, cấu hình gia sư... đều là DỮ LIỆU trong `content/` (có schema zod, validate lúc build).
   Thêm bài/khái niệm mới KHÔNG được phải sửa code.
2. **Không bịa dữ liệu**, không giả data, không bịa phân tích. Mọi số liệu thật (lãi suất, mức phí, quy định, sự kiện lịch sử)
   phải có nguồn + ngày kiểm tra. Dữ liệu mô phỏng phải dán nhãn "Dữ liệu tổng hợp (mô phỏng)" ngay trên UI.
   Không kiểm chứng được ⇒ `needs_verification` và KHÔNG nêu con số cụ thể.
3. **FE khớp dữ liệu/logic**: mọi trường trong schema nội dung và mọi module logic đều phải có UI dùng nó;
   không có UI mồ côi, không có dữ liệu không ai dùng.
4. **Clean code**: tái sử dụng, chia nhỏ function/component, **mỗi file ≤ 500 dòng** (`npm run lines` fail nếu vượt).
   Tách rõ: `lib/` (logic thuần, không React), `content/` (dữ liệu), `components/`, `app/`.
5. **Hoàn thành đầy đủ phạm vi**. Ngoài phạm vi thì nói rõ; trong phạm vi phải xong và chạy được.

## Phạm vi
- Ngoài phạm vi: backend, DB server, đăng nhập, dữ liệu thị trường realtime, bản tin hằng ngày, giao dịch thật, tư vấn đầu tư.
- Dữ liệu người dùng lưu IndexedDB (Dexie), có Export/Import JSON.
- Không API route/serverless/biến môi trường bí mật. `output: 'export'`.
- Tuyên bố cố định: "Nội dung mang tính giáo dục, không phải tư vấn đầu tư/pháp lý." (lấy từ `content/config/site.yaml`).

## Kiến trúc
```
content/     dữ liệu: config/, tracks/, concepts/, lessons/<track>/<id>/{lesson.mdx,quiz.yaml,exercises.yaml},
             planned/, simulators/, labs/<id>/, cases/, sources/
lib/         logic thuần: content (schema, load, validate, graph), finance, srs, mastery, today, quiz, search,
             tutor, stats, db, registry
components/  UI theo miền
app/         route App Router (chỉ ghép dữ liệu build-time + component)
scripts/     validate-content, build-content, check-file-lines, copy-pyodide
tests/       Vitest cho lib/
```
- Simulator/lab được map qua registry (`lib/registry/*`, key → lazy component). Không if/else theo tên.
- Số liệu thật trong MDX dùng `<Fact id="..."/>` trỏ tới `facts` trong frontmatter (có `sourceId`, `asOf`, `status`).
- Lộ trình + đồ thị khái niệm sinh tự động từ concept/prerequisites.

## Lệnh
- `npm run check` — lines + validate + typecheck + lint + test (phải xanh trước khi commit).
- `npm run build` — prebuild (lines, validate, content, pyodide) rồi `next build` → `out/`.
- `npm run dev` — dựng content rồi chạy dev server.

## Thêm nội dung
- Khái niệm: thêm vào `content/concepts/<track>/<stage>.yaml`.
- Bài: tạo thư mục `content/lessons/<track>/<lessonId>/` với `lesson.mdx` (+ `quiz.yaml`, `exercises.yaml`), xoá mục planned tương ứng.
- Nguồn: `content/sources/*.yaml`; ghi `lastVerified` là ngày kiểm tra thật.
