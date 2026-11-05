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

Thành phần MDX được phép: `Simulator`, `Lab`, `Case`, `Quiz`, `Fact`, `Callout`, `Sidenote`, `Figure`,
`WorkedExample` (`examples.yaml` trong thư mục bài), `Diagram` (`diagrams.yaml`), `Scenario` (`content/scenarios/*.yaml`), `Term` (khái niệm có sẵn).

Mỗi bài bắt buộc có `pretest` (id quiz để đoán trước khi đọc, không tính điểm) và `applications` (bài tập áp dụng vào công việc dev).
Phương pháp học và bằng chứng nằm ở `content/config/methods.yaml`; luyện tập xen kẽ cấu hình ở `content/config/practice.yaml`.

## Làng học 3D & tập trung theo chặng (`/village`)

Lộ trình được vẽ thành một ngôi làng 3D (three.js / react-three-fiber), **sinh tự động từ nội dung**:
mỗi chặng là một ga trên tuyến tàu, mỗi khái niệm là một ngôi nhà + thửa ruộng, mỗi simulator/lab/case/tình huống là một công trình.

| Trong làng | Nối với | Dữ liệu thật dùng |
|---|---|---|
| Ruộng xanh / úa, cỏ dại | Điểm thành thạo + khả năng nhớ (FSRS) của khái niệm | `lib/mastery`, `lib/world/health.ts` |
| Nhà sáng đèn ban đêm | Khái niệm đã thành thạo | trạng thái `mastered` |
| Cá trong ao (góc "Câu cá") | Thẻ ôn đến hạn; ôn ngay trong panel | `cards` đến hạn |
| Tàu chạy giữa các ga | Hành trình tập trung (chặng học/nghỉ, task lấy từ "Hôm nay") | `focusSessions` |
| Cây trong rừng của bạn | Mỗi chặng tập trung ≥ `minPlantMinutes`; bỏ dở → cây héo | `focusSessions` |
| Người dẫn đường | Mở gia sư AI đúng chế độ (`/tutor/?mode=`) | `tutor.yaml` |
| Trạm tín hiệu (giông bão) | Tình huống giả định | `content/scenarios` |

- Đồng hồ tập trung chạy trên **toàn site** (đọc bài, làm quiz không làm cây héo); rời tab quá `graceSeconds` thì chặng bị bỏ dở.
- Mặt Trời/Mặt Trăng tính theo giờ máy bạn và ngày thật (xấp xỉ thiên văn, có test với một lần trăng tròn đã biết).
- Thời tiết là lựa chọn không khí học, không phải dự báo. Nhạc và âm thanh môi trường được **tổng hợp tại chỗ** (Web Audio) — không dùng bản thu của ai.
- Không có WebGL → bản đồ 2D (SVG) cùng bố cục, điều hướng được bằng bàn phím.
- Đồ hoạ: ánh sáng môi trường HDRI (Poly Haven, CC0, qua `@pmndrs/assets`), bầu trời shader theo giờ, mây thể tích, hậu kỳ
  (AO, bloom, tone mapping ACES, chỉnh màu theo `content/world/graphics.yaml`), nước có độ sâu/bọt/phản chiếu, thảm cỏ bám camera,
  cây/nhà/người dựng thủ tục (nhà mái ngói cong, nón lá, đòn gánh, trâu, vịt, chim, đom đóm). Texture vữa/ngói/gạch/gỗ sinh bằng code.
- Mức đồ hoạ Cao/Vừa/Thấp (dữ liệu trong `graphics.yaml`, nhớ theo thiết bị; `?quality=thap` để ép mức).

| Muốn thêm/sửa | File |
|---|---|
| Địa hình, vùng, sông, hồ, núi, tuyến ray, cảnh quan, dân làng | `content/world/map.yaml` |
| Công trình cho simulator/lab/case/tình huống, người dẫn đường | `content/world/landmarks.yaml` (`model` ∈ `WORLD_MODEL_KEYS`) |
| Góc ngắm (tàu, hiên mưa, ao cá, đỉnh núi, hải đăng…) | `content/world/views.yaml` |
| Thời tiết, nhạc sinh tự động | `content/world/weather.yaml`, `content/world/music.yaml` |
| Màu/ánh sáng theo giờ, mức đồ hoạ, màu cỏ/hoa/nước, ghi công tài nguyên | `content/world/graphics.yaml` (`hdri` ∈ `HDRI_KEYS`) |
| Loài cây theo vùng, màu lá | `map.yaml` → `vegetation.species`, `vegetation.leaves` (loài ∈ `TREE_KINDS`) |
| Hành trình tập trung, thời gian ân hạn, mục tiêu ngày | `content/config/focus.yaml` |

Validator bắt buộc: mỗi lộ trình đúng một vùng; mỗi simulator/lab/case/tình huống đúng một công trình; ray không đi qua biển;
mọi tham chiếu (thời tiết, âm thanh, chế độ gia sư, góc ngắm của hành trình) phải tồn tại; mỗi góc ngắm focus có hành trình dùng.

## Kiến trúc

- `content/` — dữ liệu (schema zod trong `lib/content/schema`, validate lúc build).
- `lib/` — logic thuần (finance, srs, mastery, today, search, tutor, db, lab, world, focus, audio…), có unit test trong `tests/`.
- `components/` — UI theo miền; `app/` — route.
- `scripts/` — validate, build artefact (catalog, chỉ mục tìm kiếm, đoạn cho gia sư), giới hạn dòng, chép Pyodide.

Xem `CLAUDE.md` để biết các nguyên tắc bắt buộc.
