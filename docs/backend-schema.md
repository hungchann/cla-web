# Directus Database Schema Snapshot

Tài liệu này cung cấp cái nhìn chi tiết và toàn diện về cơ sở dữ liệu Directus đang được sử dụng cho ứng dụng Chinese Learning. Dữ liệu được trích xuất trực tiếp từ API `/collections` của máy chủ Directus chính tại `https://marutek.space`.

---

## 📌 Các Nhóm Nghiệp Vụ Chính (Modules)

Hệ thống cơ sở dữ liệu được phân chia thành các nhóm logic chính sau:

1. **Từ vựng & Từ điển (Vocabulary & Dictionary)**
2. **Sách & Thư viện (Book Library & Progress)** 
3. **Luyện nói (Speaking Dialogues & Scenarios)**
4. **Bài tập & Quizzes (Exercises & Progress)**
5. **Bài đọc & Ngữ pháp (Reading Sections & Grammar)**
6. **Người dùng & Học tập (User Profiles, Notebooks, Logs & Flashcards)**

---

## 1. Từ vựng & Từ điển (Vocabulary)

### 🔹 `vocab_items` (Từ vựng gốc)
Bảng lưu trữ các từ vựng tiếng Trung trong từ điển.
* `id` (integer, Primary Key): ID của từ.
* `name` (varchar(255)): Chữ Hán (Giản thể/Phồn thể).
* `pinyin` (varchar(255)): Phiên âm Pinyin.
* `note` (varchar(255), Nullable): Ghi chú bổ sung.
* `vocab_display_id` (integer, FK): Bản đồ hiển thị (Trình độ + Chủ đề).

### 🔹 `vocab_meanings` (Ý nghĩa từ vựng)
Bảng lưu trữ giải nghĩa tiếng Việt tương ứng cho từng từ vựng.
* `id` (integer, Primary Key)
* `item_id` (integer, FK -> `vocab_items.id`): Liên kết đến từ vựng gốc.
* `pos_id` (integer, FK -> `vocab_parts_of_speech.id`): Loại từ (Danh từ, Động từ, v.v.).
* `meaning_vi` (varchar(255)): Ý nghĩa dịch tiếng Việt.

### 🔹 `vocab_examples` (Ví dụ minh họa)
Bảng lưu trữ câu ví dụ mẫu đi kèm với từng ý nghĩa của từ.
* `id` (integer, Primary Key)
* `meaning_id` (integer, FK -> `vocab_meanings.id`): Liên kết đến ý nghĩa tương ứng.
* `chinese` (varchar(255)): Câu ví dụ chữ Hán.
* `pinyin` (varchar(255)): Phiên âm Pinyin của câu ví dụ.
* `p_vi` (varchar(255)): Bản dịch tiếng Việt.

### 🔹 `vocab_parts_of_speech` (Từ loại / Part of Speech)
Bảng lưu trữ danh sách các loại từ (Danh từ, Động từ, Tính từ, Trợ từ, v.v.).
* `id` (integer, Primary Key)
* `name` (varchar(255)): Tên loại từ (ví dụ: Noun, Verb, Adjective).

### 🔹 `vocab_display_map` (Bản đồ phân loại hiển thị)
Bảng phân phối từ vựng vào các chủ đề và cấp độ tương ứng.
* `id` (integer, Primary Key)
* `topic_id` (integer, FK -> `dictionary_topics.id`): Liên kết đến chủ đề từ vựng.
* `level_id` (integer, FK -> `dictionary_levels.id`): Liên kết đến trình độ (Cấp độ HSK).

### 🔹 `vocab_display_map_vocab_items` (Junction Table)
Bảng liên kết nhiều-nhiều giữa bản đồ hiển thị và danh sách từ vựng.
* `id` (integer, Primary Key)
* `vocab_display_map_id` (integer, FK -> `vocab_display_map.id`)
* `vocab_items_id` (integer, FK -> `vocab_items.id`)

### 🔹 `dictionary_levels` (Cấp độ từ điển)
* `id` (integer, Primary Key)
* `name` (varchar(255)): Tên cấp độ (ví dụ: HSK 1, HSK 2, v.v.).

### 🔹 `dictionary_topics` (Chủ đề từ điển)
* `id` (integer, Primary Key)
* `name` (varchar(255)): Tên tiếng Anh / Việt.
* `chinese_name` (varchar(255)): Tên tiếng Trung.

---

## 2. Sách & Thư viện (Book Library)

### 🔹 `book_library` (Kho sách truyện)
* `id` (integer, Primary Key)
* `title` (varchar(255)): Tiêu đề gốc tiếng Trung.
* `title_trans` (varchar(255)): Tiêu đề dịch tiếng Việt.
* `author` (varchar(255)): Tên tác giả tiếng Trung.
* `author_trans` (varchar(255)): Tên tác giả dịch.
* `summary` (varchar(255)): Tóm tắt sách.
* `image` (char(36), FK -> `directus_files.id`): Ảnh bìa sách.
* `view_count` (bigint): Lượt xem.
* `popular` (varchar(255)): Trạng thái thịnh hành ("true" / "false").

### 🔹 `book_chapters` (Chương sách)
* `id` (integer, Primary Key)
* `book_id` (integer, FK -> `book_library.id`): Liên kết tới cuốn sách.
* `title` (varchar(255)): Tiêu đề chương.
* `title_trans` (varchar(255)): Tiêu đề chương dịch.
* `content` (text): Nội dung chương truyện.
* `book_content` (json): Cấu trúc nội dung chi tiết.
* `image_cover` (char(36), FK -> `directus_files.id`): Ảnh chương.
* `sort_id` (varchar(255)): Thứ tự sắp xếp.

### 🔹 `book_genre` (Thể loại sách)
* `id` (integer, Primary Key)
* `title` (varchar(255)): Tên thể loại (Ví dụ: Cổ tích, Đời sống, Truyện ngụ ngôn).

### 🔹 `book_library_book_genre` (Junction Table)
Bảng liên kết nhiều-nhiều giữa sách và thể loại.
* `id` (integer, Primary Key)
* `book_library_id` (integer, FK -> `book_library.id`)
* `book_genre_id` (integer, FK -> `book_genre.id`)

### 🔹 `User_Reading_Progress` (Tiến độ đọc)
* `id` (integer, Primary Key)
* `user_id` (integer, FK -> `user_profiles.id`): Người dùng đang đọc.
* `book_id` (integer, FK -> `book_library.id`): Cuốn sách đang đọc.
* `Chapter` (varchar(255)): Chương hiện tại.
* `decimal` (varchar(255)): Phần trăm hoàn thành chương đó (tiến độ chi tiết).

---

## 3. Luyện nói (Speaking)

### 🔹 `speaking_topics` (Chủ đề giao tiếp)
* `id` (integer, Primary Key)
* `title` (varchar(255)): Tiêu đề chủ đề.
* `description` (text): Mô tả ngắn.
* `image_cover` (char(36), FK -> `directus_files.id`): Ảnh đại diện chủ đề.

### 🔹 `speaking_scenarios` (Tình huống giao tiếp)
* `id` (integer, Primary Key)
* `topic_id` (integer, FK -> `speaking_topics.id`): Liên kết đến chủ đề lớn.
* `title` (varchar(255)): Tiêu đề tình huống (ví dụ: "Đặt món ăn", "Hỏi đường").
* `image_cover` (char(36), FK -> `directus_files.id`): Ảnh bìa tình huống.

### 🔹 `speaking_dialogues` (Hội thoại chi tiết)
* `id` (integer, Primary Key)
* `scenario_id` (integer, FK -> `speaking_scenarios.id`): Liên kết tình huống.
* `speaker` (varchar(255)): Vai người nói (ví dụ: "A", "B").
* `order` (integer): Thứ tự câu nói trong đoạn hội thoại.
* `chinese_text` (text): Câu nói tiếng Trung.
* `pinyin` (text): Phiên âm Pinyin câu nói.
* `vietnamese_text` (text): Dịch câu nói sang tiếng Việt.

---

## 4. Bài tập & Quizzes (Exercises)

### 🔹 `exercises` (Câu hỏi bài tập)
Bảng lưu trữ các câu hỏi trắc nghiệm.
* `id` (integer, Primary Key)
* `question` (varchar(255)): Câu hỏi.
* `answer_A` (text): Phương án A.
* `answer_B` (varchar(255)): Phương án B.
* `answer_C` (varchar(255)): Phương án C.
* `answer_D` (varchar(255)): Phương án D.
* `Correct_answer` (varchar(255)): Đáp án chính xác ("A", "B", "C" hoặc "D").
* `Explanation` (text): Giải thích đáp án chi tiết.
* `link_exercise_id` (integer, FK -> `link_exercise.id`): Liên kết bài luyện tập tổng.
* `time_start` / `time_end` (varchar(255)): Cấu hình thời gian chạy/phát đoạn âm thanh cho câu hỏi (nếu có).

### 🔹 `lesson_of_Exercise_module` (Bài học luyện tập)
* `id` (integer, Primary Key)
* `title` (varchar(255)): Tiêu đề bài học (ví dụ: Lesson 1, Lesson 2).
* `timeSet` (varchar(255), Default `60`): Thời gian làm bài (giây).

### 🔹 `topic_of_exercise` (Chủ đề bài tập)
* `id` (integer, Primary Key)
* `title` (varchar(255)): Tên chủ đề gốc.
* `title_trans` (varchar(255)): Tên chủ đề dịch.

### 🔹 `link_exercise` (Cầu nối liên kết)
Bảng liên kết các bài học bài tập với chủ đề bài tập tương ứng.
* `id` (integer, Primary Key)
* `topic_of_exercise` (integer, FK -> `topic_of_exercise.id`)
* `lession_id` (integer, FK -> `lesson_of_Exercise_module.id`)

### 🔹 `user_exercise_progress` (Tiến trình bài tập người dùng)
* `id` (integer, Primary Key)
* `user_id` (char(36), FK -> `directus_users.id`): Người dùng làm bài.
* `topic_id` (integer, FK -> `topic_of_exercise.id`): Chủ đề làm bài.
* `lesson_id` (integer, FK -> `lesson_of_Exercise_module.id`): Bài học tương ứng.
* `progress` (varchar(255)): Tiến trình điểm số/trạng thái hoàn thành.

---

## 5. Bài đọc & Ngữ pháp (Reading Sections & Grammar)

### 🔹 `Sections` (Bài đọc song ngữ)
* `id` (char(36), Primary Key): UUID bài đọc.
* `title` (varchar(255)): Tiêu đề tiếng Trung.
* `title_trans` (varchar(255)): Tiêu đề dịch tiếng Việt.
* `image` (char(36), FK -> `directus_files.id`): Ảnh bìa bài đọc.
* `file_script` (char(36), FK -> `directus_files.id`): File kịch bản/nội dung chữ Hán có pinyin.
* `SubRip_Subtitle` (char(36), FK -> `directus_files.id`): Phụ đề định dạng SRT.
* `level` (varchar(255)): Cấp độ bài đọc (Sơ cấp, Trung cấp, HSK1-6, v.v.).

### 🔹 `genre_of_section` (Thể loại bài đọc)
* `id` (integer, Primary Key)
* `title` (varchar(255)): Tên thể loại (Đời sống, Tin tức, Du lịch, v.v.).

### 🔹 `Sections_genre_of_section` (Junction Table)
Bảng liên kết nhiều-nhiều giữa bài đọc và thể loại.
* `id` (integer, Primary Key)
* `Sections_id` (char(36), FK -> `Sections.id`)
* `genre_of_section_id` (integer, FK -> `genre_of_section.id`)

### 🔹 `grammar_of_section` (Ngữ pháp trong bài đọc)
* `id` (integer, Primary Key)
* `title` (text): Nội dung/tiêu đề điểm ngữ pháp chính xuất hiện trong bài đọc.
* `section_id` (char(36), FK -> `Sections.id`): Liên kết đến bài đọc.

### 🔹 `grammar_modules` (Module ngữ pháp tổng)
* `id` (integer, Primary Key)
* `title` (varchar(255)): Tên bộ bài học ngữ pháp.

### 🔹 `topic_of_grammarModule` (Chủ đề ngữ pháp)
* `id` (integer, Primary Key)
* `title` (varchar(255)): Tên chủ đề ngữ pháp.

### 🔹 `grammar_item` (Bài học ngữ pháp chi tiết)
* `id` (integer, Primary Key)
* `title` (varchar(255)): Tiêu đề điểm ngữ pháp.
* `description` (varchar(255)): Mô tả công thức/cách dùng.
* `content` (text): Nội dung chi tiết kèm câu ví dụ.
* `topic_id` (integer, FK -> `topic_of_grammarModule.id`)
* `grammar_module_id` (integer, FK -> `grammar_modules.id`)

---

## 6. Người dùng & Học tập (User Custom Data)

### 🔹 `user_profiles` (Thông tin bổ sung người dùng)
Mở rộng thông tin cho người dùng hệ thống.
* `id` (integer, Primary Key)
* `user_id` (varchar(255), FK -> `directus_users.id`): Tài khoản login tương ứng.
* `date_of_birth` (datetime): Ngày sinh.
* `self_assessed_hsk_level` (varchar(255)): Trình độ HSK người dùng tự đánh giá.
* `target_id` (integer, FK -> `target_user.id`): Mục tiêu học tập liên kết.
* `notification_enabled` (boolean): Bật/Tắt thông báo nhắc nhở.
* `favorite_books_id` (integer, FK -> `user_favorites.id`): Liên kết đến kho sách yêu thích.

### 🔹 `target_user` (Mục tiêu học tập)
* `id` (integer, Primary Key)
* `title` (varchar(255)): Tiêu đề mục tiêu (ví dụ: "Giao tiếp cơ bản", "Xem phim không vietsub").
* `description` (varchar(255)): Mô tả mục tiêu.

### 🔹 `UserFlashcard` (Flashcard của người dùng)
Bảng ghi nhận các từ vựng người dùng đưa vào sổ flashcard cá nhân để học thuộc lòng.
* `id` (integer, Primary Key)
* `user_id` (integer, FK -> `user_profiles.id`): Chủ sở hữu flashcard.
* `dictionary_vocab_id` (varchar(255)): ID từ vựng liên kết trong từ điển (hỗ trợ lưu text tự do hoặc ID).
* `flashcard_item_id` (varchar(255)): ID liên kết đến bảng flashcard_item.
* `deck_id` (varchar(255)): ID bộ flashcard liên kết.
* `status` (varchar(255)): Trạng thái học tập (ví dụ: "learning", "mastered", "review").

### 🔹 `flashcard_deck` (Bộ flashcard cá nhân)
* `id` (integer, Primary Key)
* `title` (varchar(255)): Tên bộ từ vựng (ví dụ: "Từ vựng đồ ăn", "HSK 3 - Tuần 1").
* `user_id` (integer, FK -> `user_profiles.id`): Chủ sở hữu bộ.

### 🔹 `flashcard_item` (Mục từ vựng trong Flashcard)
* `id` (integer, Primary Key)
* `deck_id` (integer, FK -> `flashcard_deck.id`): Bộ từ vựng chứa mục này.
* `vocab_id` (integer, FK -> `vocab_items.id`): Liên kết tới từ vựng gốc.

### 🔹 `user_vocab_notes` (Ghi chú từ vựng)
Ghi chú tự biên soạn của người dùng cho từng từ vựng.
* `id` (integer, Primary Key)
* `user_id` (integer, FK -> `user_profiles.id`): Người dùng tạo ghi chú.
* `vocab_id` (integer, FK -> `vocab_items.id`): Từ vựng được viết ghi chú.
* `note` (varchar(255)): Nội dung ghi chú cá nhân.

### 🔹 `user_learning_log` (Nhật ký học tập hàng ngày)
Bảng ghi nhận thời lượng, hoạt động học tập hàng ngày để vẽ biểu đồ tiến độ.
* `id` (integer, Primary Key)
* `user_id` (integer, FK -> `user_profiles.id`): Người dùng tương ứng.
* `date` (datetime): Ngày học tập.
* `words_learned` (varchar(255)): Số từ vựng đã học trong ngày.
* `study_minutes` (varchar(255)): Số phút học tập.
* `speaking_done` (varchar(255)): Trạng thái làm bài luyện nói.
* `reading_done` (varchar(255)): Trạng thái làm bài đọc.

### 🔹 `account_types` (Gói tài khoản đăng ký)
Bảng lưu trữ lịch sử và gói tài khoản (Standard / Premium) của người dùng.
* `id` (integer, Primary Key)
* `user_id` (integer, FK -> `user_profiles.id`): Liên kết thông tin cá nhân.
* `type` (varchar(255)): Gói tài khoản ("Standard" hoặc "Premium").
* `expired_time` (datetime): Thời gian hết hạn gói Premium.

---

## 🛠️ Trích xuất & Đồng bộ hóa thủ công

Vì dự án chạy Directus độc lập và không chứa local CLI để chạy `npx directus schema snapshot`, bạn có thể lấy toàn bộ dữ liệu cấu trúc này bằng cách gửi truy vấn trực tiếp đến Directus API công khai:

```bash
# Tải cấu trúc database thô dạng JSON
curl https://marutek.space/collections > directus_schema.json
```

Để tiện lợi hơn, một tập lệnh Node.js đã được tạo sẵn tại [scripts/fetch_directus_schema.js](file:///c:/Users/ADMIN/Code/CDSL/CLA/CHINESE-LEARNING-APP/scripts/fetch_directus_schema.js).

Bạn chỉ cần chạy lệnh sau tại thư mục gốc của dự án để tự động cập nhật snapshot YAML và tài liệu Markdown:

```bash
node scripts/fetch_directus_schema.js
```

Sau khi chạy thành công, script sẽ sinh ra 2 tập tin:
1. Tài liệu chi tiết: `docs/directus_schema_snapshot.md`
2. Cấu trúc YAML (dùng để áp dụng đồng bộ): `docs/schema_snapshot.yaml`
