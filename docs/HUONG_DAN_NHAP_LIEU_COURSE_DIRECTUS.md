# 📚 Hướng Dẫn Nhập Liệu Khóa Học & Bài Học Trên Directus Admin

Tài liệu này hướng dẫn chi tiết cho Giáo viên & Biên tập viên nội dung cách nhập dữ liệu khóa học, chương và từng loại bài học (`course_lessons`) trên hệ thống Quản trị **Directus** (`https://marutek.space`).

---

## 🏗️ 1. Cấu Trúc Khóa Học

Mỗi khóa học được tổ chức theo cấu trúc 3 cấp:

```
📘 Course (Khóa học)
 └── 📂 Course Chapter (Chương bài học, ví dụ: "Bài 1: Phát âm & Chào hỏi")
      └── 📝 Course Lesson (Các phần bài học nhỏ trong chương)
```

Một Chương chuẩn bao gồm **8 phần bài học**:
1. 🎬 **Video từ vựng** (`video_vocab`)
2. 📖 **Lý thuyết: Giải nghĩa từ vựng** (`vocab_theory`)
3. 📝 **Bài tập từ vựng** (`quiz_vocab`)
4. 🎥 **Video ngữ pháp** (`video_grammar`)
5. 📝 **Bài tập ngữ pháp** (`quiz_grammar`)
6. 🎧 **Nghe chép chính tả** (`dictation`)
7. 🗣️ **Thực hành hội thoại** (`conversation`)
8. 📥 **Bài tập bổ sung** (`extra`)

---

## 📝 2. Hướng Dẫn Chi Tiết Nhập Liệu Từng Loại Bài Học (`course_lessons`)

Khi tạo/chỉnh sửa một mục trong bảng **`course_lessons`**, giáo viên cần điền các thông tin cơ bản:
- **`title`**: Tiêu đề hiển thị (vd: `1. Video từ vựng` hoặc `5. Bài tập Nghe chép chính tả`).
- **`status`**: Chuyển thành **`Published`** để xuất bản cho học viên xem.
- **`sort`**: Thứ tự hiển thị trong chương (1 đến 8, mỗi lesson type đúng một lần).
- **`chapter_id`**: Chọn Chương chứa bài học này từ dropdown.

Dưới đây là cách chọn các trường dữ liệu đặc thù cho từng loại bài học (`lesson_type`):

---

### 1️⃣ Video Từ Vựng (`lesson_type = video_vocab`)
- **Mục đích**: Hiển thị video clip bài giảng từ vựng và danh sách từ vựng chi tiết kèm phiên âm, nghĩa tiếng Việt, ví dụ.
- **Cách nhập**:
  - `lesson_type`: Chọn **`video_vocab`**.
  - `video_section_id`: Nhấp chọn 1 item bài giảng từ danh sách **`video_section`**.

---

### 2️⃣ Lý Thuyết: Giải Nghĩa Từ Vựng (`lesson_type = vocab_theory`)
- **Mục đích**: Hiển thị danh sách từ vựng của bài học dạng lý thuyết — từng từ kèm phiên âm, loại từ, nghĩa tiếng Việt, ví dụ cụ thể và ghi chú cách viết/bộ chữ Hán (giống giao diện STUY4).
- **Cách nhập**:
  - `lesson_type`: Chọn **`vocab_theory`**.
  - `vocab_display_map_id`: Nhấp chọn 1 nhóm từ vựng từ danh sách **`vocab_display_map`** (mỗi `vocab_display_map` = 1 chủ đề từ vựng gắn với level + topic; hệ thống tự nạp các `vocab_items` + nghĩa + ví dụ).

---

### 3️⃣ Bài Tập Từ Vựng (`lesson_type = quiz_vocab`)
- **Mục đích**: Hiển thị các câu hỏi trắc nghiệm A/B/C/D từ vựng.
- **Cách nhập**:
  - `lesson_type`: Chọn **`quiz_vocab`**.
  - `exercise_id`: Nhấp chọn 1 bộ bài tập từ danh sách **`link_exercise`** (Hệ thống tự nạp các câu hỏi, đáp án đúng và giải thích).

---

### 4️⃣ Video Ngữ Pháp (`lesson_type = video_grammar`)
- **Mục đích**: Hiển thị video bài giảng ngữ pháp kèm dòng giải thích/phụ đề chạy theo thời gian thực của video.
- **Cách nhập**:
  - `lesson_type`: Chọn **`video_grammar`**.
  - `video_section_id`: Nhấp chọn 1 item bài giảng ngữ pháp từ danh sách **`video_section`**.

---

### 5️⃣ Bài Tập Ngữ Pháp (`lesson_type = quiz_grammar`)
- **Mục đích**: Hiển thị các câu hỏi trắc nghiệm ngữ pháp.
- **Cách nhập**:
  - `lesson_type`: Chọn **`quiz_grammar`**.
  - `exercise_id`: Nhấp chọn 1 bộ bài tập ngữ pháp từ danh sách **`link_exercise`**.

---

### 6️⃣ Nghe Chép Chính Tả (`lesson_type = dictation`) 🔥 *(Đặc thù)*
- **Mục đích**: Học viên nghe âm thanh và chép lại chính xác câu tiếng Trung. Hệ thống tự động chấm điểm dựa trên đáp án nhập sẵn.
- **Cách nhập**:
  - `lesson_type`: Chọn **`dictation`**.
  - **`audio_id`**: Tải lên hoặc chọn file âm thanh **MP3** chứa phát âm của đề bài.
  - **`content`**: **Nhập văn bản tiếng Trung chuẩn làm đáp án chấm điểm**.
    - *Ví dụ mẫu*: `你今年多大了？` hoặc `你家有几口人？`
    - *Lưu ý*: Nhập chính xác câu tiếng Trung (học viên nhập đúng câu này sẽ nhận điểm 100%).

---

### 7️⃣ Thực Hành Hội Thoại (`lesson_type = conversation`)
- **Mục đích**: Luyện nói mẫu hội thoại với AI, nhận phản hồi phát âm theo từng nhân vật A/B.
- **Cách nhập**:
  - `lesson_type`: Chọn **`conversation`**.
  - `scenario_id`: Nhấp chọn 1 kịch bản hội thoại từ danh sách **`speaking_scenarios`**.

---

### 8️⃣ Bài Tập Bổ Sung (`lesson_type = extra`)
- **Mục đích**: Cung cấp giao diện tải 3 file tài liệu về máy cho học viên ôn tập thêm.
- **Cách nhập**:
  - `lesson_type`: Chọn **`extra`**.
  - **`extra_pdf_id`**: Tải lên file PDF Đề bài tập.
  - **`extra_answer_id`**: Tải lên file PDF Đáp án bài tập.
  - **`extra_audio_id`**: Tải lên file Audio MP3 kèm theo (nếu có).

---

## 📋 3. Bảng Tra Cứu Nhanh Các Trường Theo Loại Bài Học

| Loại Bài Học (`lesson_type`) | Trường Bắt Buộc Cần Điền | Ghi Chú |
| :--- | :--- | :--- |
| **Video từ vựng** (`video_vocab`) | `video_section_id` | Select dropdown trỏ tới `video_section` |
| **Lý thuyết: Giải nghĩa từ vựng** (`vocab_theory`) | `vocab_display_map_id` | Select dropdown trỏ tới `vocab_display_map` (tự nạp từ vựng + nghĩa + ví dụ) |
| **Bài tập từ vựng** (`quiz_vocab`) | `exercise_id` | Select dropdown trỏ tới `link_exercise` |
| **Video ngữ pháp** (`video_grammar`) | `video_section_id` | Select dropdown trỏ tới `video_section` |
| **Bài tập ngữ pháp** (`quiz_grammar`) | `exercise_id` | Select dropdown trỏ tới `link_exercise` |
| **Nghe chép chính tả** (`dictation`) | `audio_id` & `content` | `audio_id`: file âm thanh đề bài<br>`content`: câu tiếng Trung chuẩn để chấm điểm |
| **Thực hành hội thoại** (`conversation`) | `scenario_id` | Select dropdown trỏ tới `speaking_scenarios` |
| **Bài tập bổ sung** (`extra`) | `extra_pdf_id`, `extra_answer_id`, `extra_audio_id` | Tải lên các file PDF/Audio cho học viên tải về |

---

## ⚠️ 4. Các Lưu Ý Quan Trọng

1. **Trạng thái Published**: Tất cả mục trong `course`, `course_chapters`, và `course_lessons` phải được chọn **Status = Published** thì mới hiển thị trên giao diện học của học viên.
2. **Thứ tự Sort**: Điền số `sort` tăng dần (1, 2, 3...) để các bài học xuất hiện đúng trình tự.
3. **Bài tập Dictation**: Trường `content` là căn cứ để thuật toán chấm điểm tự động. Tránh gõ sai chính tả hoặc gõ thừa ký tự lạ trong `content`.
