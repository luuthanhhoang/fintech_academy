# FinAI Academy

Sổ tay học hằng ngày cho hai lộ trình: **Fintech từ con số 0** và **AI/LLM engineer**.
Website tĩnh (Next.js static export), không backend; dữ liệu học tập lưu trong IndexedDB của trình duyệt.

> Nội dung mang tính giáo dục, không phải tư vấn đầu tư/pháp lý.

## Chạy local

```bash
npm ci
npm run dev        # dựng content + chép Pyodide, rồi chạy dev server
npm run check      # giới hạn 500 dòng + validate nội dung + typecheck + lint + test
npm run build      # prebuild (check dòng, validate, dựng artefact, Pyodide) → next build → out/
```

Yêu cầu Node ≥ 22.

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

Thành phần MDX được phép: `Simulator`, `Lab`, `Case`, `Quiz`, `Fact`, `Callout`, `Sidenote`, `Figure`.

## Kiến trúc

- `content/` — dữ liệu (schema zod trong `lib/content/schema`, validate lúc build).
- `lib/` — logic thuần (finance, srs, mastery, today, search, tutor, db, lab…), có unit test trong `tests/`.
- `components/` — UI theo miền; `app/` — route.
- `scripts/` — validate, build artefact (catalog, chỉ mục tìm kiếm, đoạn cho gia sư), giới hạn dòng, chép Pyodide.

Xem `CLAUDE.md` để biết các nguyên tắc bắt buộc.
