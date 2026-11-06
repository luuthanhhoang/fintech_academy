# FinAI Academy — Hướng dẫn cho Claude Code

Website học cá nhân (chỉ FE, static export, deploy Vercel) cho 3 lộ trình: Fintech từ 0, AI/LLM engineer và Fullstack web developer.
Bài mới viết theo giọng trải nghiệm: mở bằng `<Callout kind="story">` (tình huống giả định), có `<Callout kind="field">` (góc nhìn người viết, có nhãn trung thực) — nhãn lấy từ `site.yaml → callouts`; kiến thức cốt lõi vẫn phải đầy đủ.

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
             planned/, simulators/, labs/<id>/, cases/, scenarios/, sources/, world/ (làng 3D)
lib/         logic thuần: content (schema, load, validate, graph), finance, srs, mastery, today, quiz, search,
             tutor, stats, db, registry, world (địa hình, bố cục, bầu trời), focus (máy trạng thái), audio (Web Audio)
components/  UI theo miền
app/         route App Router (chỉ ghép dữ liệu build-time + component)
scripts/     validate-content, check-file-lines, copy-pyodide
app/generated  route tĩnh trả catalog/search/tutor/lab JSON (dev: tính lại mỗi request nên không bao giờ lệch code)
tests/       Vitest cho lib/
```
- Simulator/lab được map qua registry (`lib/registry/*`, key → lazy component). Không if/else theo tên.
- Số liệu thật trong MDX dùng `<Fact id="..."/>` trỏ tới `facts` trong frontmatter (có `sourceId`, `asOf`, `status`).
- Lộ trình + đồ thị khái niệm sinh tự động từ concept/prerequisites.
- Làng học: ga/lô đất/công trình đặt tự động từ track/concept/lesson; công trình 3D map qua `components/world/models/registry.tsx`
  theo `WORLD_MODEL_KEYS`. Trạng thái làng (ruộng, đèn, cá, cây) chỉ suy ra từ dữ liệu học thật trong IndexedDB.
- Nhận diện "Tuyến học": mỗi track có `color` (content/tracks) → biến CSS `--line-<track>`; vẽ đường ray màu ở /tracks (sơ đồ tuyến),
  trang track, đầu bài học, thanh bài trong ga. Tiêu đề/giao diện: Be Vietnam Pro (`font-display`); thân bài đọc: Newsreader (`--font-read`).
- Điều hướng (`site.yaml → nav`): 4 điểm đến (Làng, Hôm nay, Lộ trình, Thực hành) + "Hỏi gia sư" + menu "Của bạn"; hub /workshop gom luyện tập.
- Mô hình 3D CC0 (Kenney, Quaternius) trong `public/models` (+NOTICE); khai báo ở `content/world/assets.yaml`, validator đọc từng .glb.
- Đồng hồ tập trung là `FocusProvider` trong AppShell (chạy mọi trang); logic thuần ở `lib/focus/machine.ts`.
- `components/world/**` tắt rule `react-hooks/immutability` (three.js mutate object mỗi frame trong useFrame).

## Quyết định kỹ thuật đã chốt
- TypeScript 6.0.x (không dùng TS 7: typescript-eslint chưa hỗ trợ TS 7 tại thời điểm dựng dự án).
- Pyodide self-host tại `/pyodide/` (copy từ npm lúc build), chạy trong module worker tạo từ Blob (`lib/lab/worker-source.ts`).
- Font self-host qua @fontsource (không phụ thuộc mạng lúc build).
- Schema nội dung dùng `z.strictObject` — khoá lạ (vd lỗi YAML flow-mapping có dấu phẩy) làm build fail.
- Nội dung MDX không được chứa biểu thức `{...}`; dùng `<Fact id/>` cho số liệu thật.

## Lệnh
- `npm run check` — lines + validate + typecheck + lint + test (phải xanh trước khi commit).
- `npm run build` — prebuild (lines, validate, content, pyodide) rồi `next build` → `out/`.
- `npm run dev` — dựng content rồi chạy dev server.

## Thêm nội dung
- Khái niệm: thêm vào `content/concepts/<track>/<stage>.yaml`.
- Bài: tạo thư mục `content/lessons/<track>/<lessonId>/` với `lesson.mdx` (+ `quiz.yaml`, `exercises.yaml`), xoá mục planned tương ứng.
- Nguồn: `content/sources/*.yaml`; ghi `lastVerified` là ngày kiểm tra thật.
