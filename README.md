# FinAI Academy

Sổ tay học hằng ngày cho ba lộ trình: **Fintech từ con số 0**, **AI/LLM engineer** và **Fullstack web developer**.
Website tĩnh (Next.js static export), không backend; dữ liệu học tập lưu trong IndexedDB của trình duyệt.

> Nội dung mang tính giáo dục, không phải tư vấn đầu tư/pháp lý.

## Chạy local

```bash
npm ci
npm run dev        # chép Pyodide rồi chạy dev server (dữ liệu nội dung luôn tính từ content/, không cần dựng trước)
npm run check      # giới hạn 500 dòng + validate nội dung + typecheck + lint + test
npm run build      # prebuild (check dòng, validate, dựng artefact, Pyodide) → next build → out/
```

Yêu cầu Node ≥ 22. Trình quản lý gói chuẩn là **npm** (`package-lock.json`). Dùng Yarn 2+ vẫn được nhờ `.yarnrc.yml`
(`nodeLinker: node-modules`); nếu trước đó đã lỡ cài ở chế độ PnP, xoá `.pnp.cjs`, `.pnp.loader.mjs`, `.yarn/` rồi cài lại.
Lỗi `EACCES` ở `~/.npm/_cacache` là do cache npm có file thuộc root: chạy `sudo chown -R $(id -u):$(id -g) ~/.npm`.

## Deploy lên Vercel

1. Import repo vào Vercel (framework tự nhận là Next.js).
2. Build command: `npm run build` (npm tự chạy `prebuild`). Output: Next.js tự xử lý `output: 'export'` (thư mục `out/`).
3. Không cần biến môi trường. Không có API route/serverless.
4. Build sẽ **fail** nếu: có file > 500 dòng, nội dung vi phạm schema/tham chiếu/vòng lặp tiền đề, bài có số liệu mà thiếu nguồn, dữ kiện chưa kiểm chứng nêu số, MDX chứa biểu thức `{...}`.

## Thêm nội dung (không cần sửa code)

| Muốn thêm | Làm gì |
|---|---|
| Khái niệm | Thêm vào `content/concepts/<track>/<stage>.yaml` (id, name vi/en, short, prerequisites, tags, difficulty) |
| Bài học | Tạo `content/lessons/<track>/<lessonId>/lesson.mdx` (+ `quiz.yaml`, `exercises.yaml`); xoá mục tương ứng trong `content/planned/<track>.yaml` |
| Nguồn | Thêm vào `content/sources/*.yaml` với `accessed` = ngày kiểm tra thật |
| Số liệu thật | Khai báo trong `facts` của frontmatter (sourceId, asOf, status) và dùng `<Fact id="..."/>` trong MDX |
| Simulator | Metadata trong `content/simulators/<id>.yaml`; dùng lại `componentKey` có sẵn. Kiểu simulator mới cần thêm component + key vào `lib/registry/keys.ts` |
| Code lab | Thư mục `content/labs/<id>/` với `lab.yaml`, `starter.py`, `tests.py` (các hàm `test_*`), `solution.py` |
| Case study | `content/cases/<id>.yaml` — mỗi sự kiện timeline phải có `sourceIds` và `status` |
| Cấu hình | `content/config/*.yaml`: nav, phím tắt, ngưỡng thành thạo, FSRS, khối "Hôm nay", tìm kiếm, gia sư AI |

Khối `Callout` có `kind`: note, warning, dev, example, `story` (tình huống mở đầu — giả định) và `field` (ghi chép thực chiến — góc nhìn người viết); nhãn và câu ghi chú trung thực nằm trong `site.yaml → callouts`.

Thành phần MDX được phép: `Simulator`, `Lab`, `Case`, `Quiz`, `Fact`, `Callout`, `Sidenote`, `Figure`,
`WorkedExample` (`examples.yaml` trong thư mục bài), `Diagram` (`diagrams.yaml`), `Scenario` (`content/scenarios/*.yaml`), `Term` (khái niệm có sẵn).

Mỗi bài bắt buộc có `pretest` (id quiz để đoán trước khi đọc, không tính điểm) và `applications` (bài tập áp dụng vào công việc dev).
Phương pháp học và bằng chứng nằm ở `content/config/methods.yaml`; luyện tập xen kẽ cấu hình ở `content/config/practice.yaml`.

## Giao diện

- Trang chủ `/`: học tiếp bài đang dở (hoặc bài kế tiếp theo lộ trình), số thẻ cần ôn, kế hoạch hôm nay và ba lộ trình.
- Mọi bài học đều mở; quan hệ tiền đề chỉ là gợi ý "nên biết trước", không khoá bài nào.
- Điều hướng (`site.yaml → nav`): Trang chủ, Hôm nay, Lộ trình, Thực hành + "Hỏi gia sư" + menu "Của bạn".
- Mỗi lộ trình có màu tuyến (`content/tracks/*.yaml → color`), dùng cho sơ đồ tuyến, trang lộ trình, đầu bài học.

## Kiến trúc

- `content/` — dữ liệu (schema zod trong `lib/content/schema`, validate lúc build).
- `lib/` — logic thuần (finance, srs, mastery, today, roadmap, search, tutor, db, lab…), có unit test trong `tests/`.
- `components/` — UI theo miền; `app/` — route.
- `app/generated/` — route tĩnh trả catalog, chỉ mục tìm kiếm, đoạn cho gia sư, lab (luôn khớp nội dung).
- `scripts/` — validate, giới hạn dòng, chép Pyodide.

Xem `CLAUDE.md` để biết các nguyên tắc bắt buộc.
