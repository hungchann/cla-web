# 📚 Hướng Dẫn Nhập Liệu Khóa Học & Bài Học Trên Directus Admin

Tài liệu hướng dẫn Giáo viên & Biên tập viên nội dung nhập dữ liệu khóa học, chương và từng loại bài học (`course_lessons`) trên **Directus** (`https://marutek.space`).

> ⚙️ **Chạy 1 lần trước khi nhập (cần credential admin):**
> 1. `node scripts/setup-course-content-schema.js` — tạo schema nội dung bài học (lesson_vocab, lesson_questions, lesson_theory_cards, lesson_dictation, lesson_dialogues, banners).
> 2. `node scripts/setup-course-split-schema.js` — (Phase 2) tách nội dung theo loại bài: `lesson_video`, `lesson_theory`, `lesson_extra`.
> 3. `node scripts/apply-course-field-conditions.js` — form hiện/ẩn field theo `lesson_type`.
> 4. `node scripts/grant-course-permissions.js` — cấp quyền read cho toàn bộ collection khóa học.
> 5. (tuỳ chọn) `node scripts/group-course-collections.js --apply` — gom collection vào folder trong sidebar.

---

## 🏗️ 1. Cấu Trúc Khóa Học

```
📘 Course (Khóa học)
 └── 📂 Course Chapter (Chương bài học)
      └── 📝 Course Lesson (Bài học) — mỗi lesson tự chứa nội dung riêng
```

Một Chương chuẩn có **8 phần bài học**:
1. 🎬 **Video từ vựng** (`video_vocab`)
2. 📖 **Lý thuyết: Giải nghĩa từ vựng** (`vocab_theory`)
3. 📝 **Bài tập từ vựng** (`quiz_vocab`)
4. 🎥 **Video ngữ pháp** (`video_grammar`)
5. 📝 **Bài tập ngữ pháp** (`quiz_grammar`)
6. 🎧 **Nghe chép chính tả** (`dictation`)
7. 🗣️ **Thực hành hội thoại** (`conversation`)
8. 📥 **Bài tập bổ sung** (`extra`)

> ⭐ **Cách nhập nhanh**: mở **Content → course_lessons → Add Item**, chọn `lesson_type`
> rồi điền **tất cả ngay trong 1 form** — video/lý thuyết/bài tập bổ sung thêm bằng nút
> **"+" ngay trong form** (không phải chuyển sang collection khác).
> Các collection con (`lesson_video`, `lesson_theory`, `lesson_extra`, `lesson_vocab`,
> `lesson_questions`, …) chỉ là nơi lưu — đã ẩn khỏi sidebar cho gọn.

---

## 📝 2. Nhập Liệu Từng Loại Bài Học

Khi tạo mới trong **`course_lessons`**:
- **`lesson_type`**: chọn loại bài — form tự hiện đúng nhóm trường cần nhập.
- **`title`**, **`status`** = Published, **`sort`** (1–8), **`chapter_id`**.

### 1️⃣ & 4️⃣ Video Từ Vựng / Video Ngữ Pháp (`video_vocab` / `video_grammar`)
- Kéo xuống mục **lesson_video** → bấm **"+"** (hoặc bấm edit dòng có sẵn): **`video_file`** (upload **MP4** từ máy), **`srt_file`** (upload file **.srt** — dòng 1 chữ Trung / dòng 2 pinyin / dòng 3+ nghĩa Việt), `video_cover` (ảnh bìa, tùy chọn).
- **Video từ vựng — từ vựng theo thời gian**: kéo xuống mục **lesson_vocab**, bấm **"+"** thêm từng dòng: `word`, `pinyin`, `meaning`, **`time_start`** / **`time_end`** (định dạng `00:00:04,000`). Từ vựng sẽ hiện lên khi video chạy tới mốc đó.

### 2️⃣ Lý Thuyết (`vocab_theory`)
- Kéo xuống mục **lesson_theory** → bấm **"+"** (hoặc edit dòng có sẵn): **`vocab_display_map_id`** — chọn nhóm từ vựng từ từ điển (hệ thống tự nạp từ + nghĩa + ví dụ).
- **Card lý thuyết tự điền** (tùy chọn): mục **lesson_theory_cards** → bấm **"+"**: `title`, **`content`** (soạn chữ, chèn ảnh), **`image_id`** (upload ảnh), `sort`.

### 3️⃣ & 5️⃣ Bài Tập (`quiz_vocab` / `quiz_grammar`)
- Chọn `lesson_type` = `quiz_vocab` (hoặc `quiz_grammar`).
- Mục **lesson_questions** → bấm **"+"** cho từng câu: `question`, `answer_A…D`, `correct_answer` (A/B/C/D), `explanation`, **`audio_id`** (upload audio câu hỏi — không bắt buộc), `sort`.
- Học viên chọn xong được **chấm điểm + giải thích ngay tại chỗ**.

### 6️⃣ Nghe Chép Chính Tả (`dictation`)
- Mục **lesson_dictation** → bấm **"+"** cho **từng câu**: **`audio_id`** (upload MP3 của câu đó), **`answer_text`** = câu tiếng Trung chuẩn để chấm điểm. 5 câu = 5 dòng.

### 7️⃣ Thực Hành Hội Thoại (`conversation`)
- Mục **lesson_dialogues** → bấm **"+"**: `chinese_text`, `pinyin`, `vietnamese_text`, `speaker` (A/B), `order`. Tự điền câu thoại của riêng bài.

### 8️⃣ Bài Tập Bổ Sung (`extra`)
- Kéo xuống mục **lesson_extra** → bấm **"+"** (hoặc edit dòng có sẵn): `extra_pdf_id` (đề), `extra_answer_id` (đáp án), `extra_audio_id` (audio, tùy chọn) — upload file.

---

## 📋 3. Bảng Tra Cứu Nhanh

| Loại Bài Học | Nơi nhập nội dung | Ghi chú |
| :--- | :--- | :--- |
| `video_vocab` | `lesson_video` + `lesson_vocab` | Video mp4 + srt; từ vựng có `time_start/time_end` |
| `video_grammar` | `lesson_video` | Video mp4 + srt (không cần từ vựng theo giây) |
| `vocab_theory` | `lesson_theory` + `lesson_theory_cards` | Chọn nhóm từ điển; thêm card chữ/ảnh tùy chọn |
| `quiz_vocab` / `quiz_grammar` | `lesson_questions` | Có `audio_id` tùy chọn; chấm + giải thích tại chỗ |
| `dictation` | `lesson_dictation` | Mỗi câu 1 `audio_id` + 1 `answer_text` |
| `conversation` | `lesson_dialogues` | Tự điền hội thoại A/B |
| `extra` | `lesson_extra` | Upload file đề/đáp án/audio |

---

## 🖼️ 4. Banner Carousel Trang Chủ

Content → **`banners`** → Add Item: `image` (upload ảnh), `link` (vd `/courses/3`), `sort`, `status` = Published. Dashboard sẽ cuộn các ảnh này.

---

## ⚠️ 5. Các Lưu Ý Quan Trọng

1. Mọi mục trong `course`, `course_chapters`, `course_lessons` và các collection con phải **Published** mới hiển thị.
2. `sort` tăng dần (1, 2, 3…) để đúng trình tự.
3. `lesson_dictation.answer_text` là căn cứ chấm điểm — tránh gõ sai/thiếu ký tự.
4. Field hiện/ẩn theo `lesson_type` — chọn `lesson_type` trước khi điền.
5. Kiểm tra nhanh: `http://localhost:3020/courses/<courseId>/learn?lesson=<lessonId>`.
