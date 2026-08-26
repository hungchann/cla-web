# Kiến trúc dữ liệu — cla-web

> Sơ đồ thuần **data movement**: dữ liệu chảy từ đâu → đâu, qua tầng nào.
> Không mô tả logic nghiệp vụ (điều kiện rẽ nhánh) — xem `docs/premium-directus-contract.md` cho contract premium.

---

## 1. Bức tranh tổng thể (System Context)

```mermaid
flowchart LR
    subgraph CLIENT["Trình duyệt — cla-web (Next.js App Router)"]
        PAGES["app/** (23 pages)"]
        APILAYER["api/* (16 module)"]
        SERVICES["services/* (transcribe, audio, subtitle)"]
        PAGES --> APILAYER
        PAGES --> SERVICES
    end

    subgraph DIRECTUS["Directus — marutek.space"]
        REST["REST /items/*"]
        FLOWS["Flows /flows/trigger/*"]
        GQL["GraphQL /graphql"]
        GQSYS["GraphQL System /graphql/system"]
        ASSETS["Assets /assets/*"]
        SMTP["SMTP auth /smtp-auth"]
    end

    APILAYER -->|"CRUD nội dung + user"| REST
    APILAYER -->|"17 business flows"| FLOWS
    APILAYER -->|"query nội dung"| GQL
    APILAYER -->|"refresh token, delete user"| GQSYS
    APILAYER -->|"đăng nhập / refresh session"| SMTP
    PAGES -->|"ảnh, audio, GIF"| ASSETS

    subgraph EXTERNAL["Dịch vụ ngoài"]
        VIETQR["img.vietqr.io"]
        MARUTEK["Marutek Speech API<br/>/api/speech/transcribe"]
        YOUTUBE["YouTube Data API v3"]
    end

    SERVICES -->|"audio (multipart/base64)"| MARUTEK
    PAGES -->|"render QR thanh toán"| VIETQR
    PAGES -->|"thumbnail, snippet video"| YOUTUBE
```

---

## 2. Bản đồ Routes (App Router)

```mermaid
flowchart TD
    ROOT["app/"] --> HOME["page.tsx — Landing"]
    ROOT --> AUTH["(auth)/"]
    ROOT --> APPG["(app)/"]

    AUTH --> SI["sign-in"]
    AUTH --> RG["register"]
    AUTH --> FP["forgot-password"]

    APPG --> DB["dashboard"]
    APPG --> CO["courses/"]
    APPG --> BI["bilingual/"]
    APPG --> ST["stories/"]
    APPG --> VI["video/"]
    APPG --> FL["flashcard/"]
    APPG --> GR["grammar"]
    APPG --> SP["speaking"]
    APPG --> PR["pricing"]

    CO --> COD["[id] — chi tiết khóa học"]
    COD --> COL["learn — bài học + luyện tập"]

    BI --> BIL["[id] — bài đọc song ngữ"]
    ST --> STL["[id] — sách/truyện"]

    VI --> VID["[id] — xem video"]
    VID --> VQ["quiz"]
    VID --> VSU["subtitles"]
    VI --> VRE["results"]

    FL --> FLS["study"]
    FL --> FLA["add"]
    FL --> FLR["results"]
```

---

## 3. Luồng dữ liệu phân lớp

```mermaid
flowchart TB
    subgraph L1["Tầng 1 — Pages & Components (client)"]
        DASH["dashboard"] 
        COURSE["courses / learn"]
        BILING["bilingual"]
        STORY["stories"]
        VIDEO["video / quiz / subtitles"]
        FLASH["flashcard"]
        GRAM["grammar"]
        SPEAK["speaking"]
        PRICE["pricing"]
        AUTHP["sign-in / register / forgot-password"]
    end

    subgraph L2["Tầng 2 — Hooks & Context"]
        USEAUTH["useAuth"]
        PREMIUMCTX["PremiumContext"]
        HOOKS["useDetailedVideoLogic · useVocabFlashcardData · useSubtitleSync · ..."]
    end

    subgraph L3["Tầng 3 — API Modules (api/*)"]
        APISERVICE["apiService"]
        COURSES["courses"]
        BIMOD["bilingual"]
        STORIES["stories"]
        VIDEOMOD["video"]
        NOTEBOOK["notebook"]
        VOCAB["vocabulary"]
        GRAMMAR["grammar"]
        SPEAKING["speaking"]
        TARGET["target"]
        PROFILE["profile"]
        USERMOD["user"]
        PLANS["plans"]
        SEGMENT["segment"]
        AUTHCFG["authConfig"]
    end

    subgraph L4["Tầng 4 — Transport"]
        AXIOS["axios instance (authConfig)<br/>REST + token interceptor"]
        GQLC["graphql client<br/>/graphql + /graphql/system"]
        FETCH["fetch()<br/>Marutek Speech API"]
    end

    L1 --> L2 --> L3 --> L4

    COURSE --> COURSES
    BILING --> BIMOD
    STORY --> STORIES
    VIDEO --> VIDEOMOD
    VIDEO --> HOOKS
    FLASH --> NOTEBOOK
    GRAM --> GRAMMAR
    SPEAK --> SPEAKING
    DASH --> APISERVICE
    DASH --> TARGET
    PRICE --> PLANS
    AUTHP --> USERMOD
    AUTHP --> PROFILE

    AXIOS --> RESTI["Directus REST /items/*<br/>+ /users/me"]
    GQLC --> GQLD["Directus GraphQL<br/>nội dung + system"]
    FETCH --> SPEECH["Marutek Speech API"]
```

---

## 4. Sequence — các luồng dữ liệu chính

> Toàn bộ tuyến tính, chỉ thể hiện đường đi của dữ liệu.

### 4.1. Xác thực & phiên đăng nhập

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant P as (auth)/ pages
    participant F as Directus Flow<br/>REGISTER / RESET_PASSWORD
    participant SMTP as /smtp-auth
    participant LS as localStorage<br/>(tokenUtils)
    participant AX as axios interceptor
    participant GS as /graphql/system

    U->>P: submit form (email, password)
    P->>F: POST register / reset-password payload
    Note over P,LS: Đăng nhập: nhận access_token + refresh_token + user_data
    P->>LS: lưu access_token, refresh_token, user_data
    U->>AX: request API bất kỳ
    AX->>GS: mutation auth_refresh (refresh_token)
    GS-->>AX: access_token mới
    AX->>LS: ghi đè token
```

### 4.2. Khóa học & luyện tập

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant CP as courses/[id]/learn
    participant C as api/courses
    participant DR as Directus REST /items/*
    participant FLW as Directus Flows
    participant SPK as services/marutekTranscribeService
    participant MA as Marutek Speech API

    U->>CP: mở khóa học
    CP->>C: getCourseById(id)
    C->>DR: GET course, course_chapters, course_lessons
    DR-->>CP: danh sách chapter → lesson
    U->>CP: mở lesson
    CP->>C: getLessonTheory / exercises / drills
    C->>DR: GET lesson_theory, exercise collections, vocab_display_map*
    U->>CP: nộp bài / luyện nói
    CP->>FLW: trigger SUBMIT_EXERCISE_FLOW, EXERCISE_COUNT_*
    CP->>SPK: audio blob (multipart/base64)
    SPK->>MA: POST /api/speech/transcribe
    MA-->>CP: transcript + score
```

### 4.3. Đọc song ngữ & truyện

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant BP as bilingual pages
    participant STP as stories pages
    participant B as api/bilingual
    participant S as api/stories
    participant G as Directus GraphQL /graphql

    U->>BP: danh mục + chi tiết
    BP->>B: getBilingualItems / getSectionById
    B->>G: query Sections, genre_of_section, hsk_level, grammar_of_section
    G-->>BP: sections + grammar
    U->>STP: thư viện sách
    STP->>S: getBooks / latest / trending / popular
    S->>G: query book_library, book_genre, book_library_book_genre
    G-->>STP: books
    U->>STP: đọc chương
    STP->>S: upsert User_Reading_Progress
    S->>G: mutation create/update User_Reading_Progress
```

### 4.4. Video & phụ đề AI

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant VP as video/[id] (+quiz, subtitles)
    participant H as useDetailedVideoLogic
    participant V as api/video
    participant G as Directus GraphQL
    participant YT as YouTube Data API v3
    participant SUB as services/subtitle
    participant MA as Marutek Speech API

    U->>VP: mở video
    VP->>V: genres / section data
    V->>G: query video_genre, video_section
    VP->>YT: GET thumbnail + snippet (API key)
    VP->>SUB: parse/pair phụ đề
    SUB->>MA: POST audio segment cần transcribe
    MA-->>VP: transcript đồng bộ subtitle
    VP->>H: kết quả quiz/luyện tập
```

### 4.5. Flashcard & sổ tay từ vựng

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant FP as flashcard pages
    participant N as api/notebook
    participant VOC as api/vocabulary
    participant G as Directus GraphQL
    participant R as Directus REST /items/*

    U->>FP: mở sổ tay / deck
    FP->>N: decks + vocab trong deck
    N->>G: query flashcard_deck, vocab_display_map*, dictionary_levels
    FP->>VOC: nghĩa + ví dụ từ vựng
    VOC->>R: GET vocab_meanings, vocab_examples
    U->>FP: thêm thẻ / note
    FP->>N: create_flashcard_item, create_vocab_items
    N->>G: mutation flashcard_item, vocab_items, UserFlashcard
    FP->>N: tra từ điển chi tiết
    N->>G: trigger VOCAB_DETAIL_FLOW, ADD/UPDATE_NOTE_VOCAB_FLOW
```

### 4.6. Trạng thái Premium

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant PC as PremiumContext
    participant CACHE as localStorage<br/>cla_premium_status (TTL 5')
    participant PF as api/profile
    participant FLW as ACCOUNT_TYPE_FLOW
    participant AT as account_types

    U->>PC: mount app
    PC->>CACHE: đọc cache theo userId
    PC->>PF: getAccountType()
    PF->>FLW: GET /flows/trigger/{id}?userId=
    FLW->>AT: join user_profiles ↔ account_types
    AT-->>PC: { name/type, is_active }
    PC->>PC: isPremiumAccountType()
    PC-->>U: isPremium → gate nội dung toàn app
    Note over PC: refreshPremium(force) khi cần đồng bộ lại
```

### 4.7. Thanh toán Premium (VietQR)

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant PP as pricing page
    participant PL as api/plans
    participant DR as Directus REST /items/*
    participant QR as img.vietqr.io
    participant ADM as Admin (Directus panel)

    U->>PP: chọn gói
    PP->>PL: getAccountPlans() / getPlanById
    PL->>DR: GET account_plans (status=published)
    U->>PP: nhập voucher (tuỳ chọn)
    PP->>PL: getVoucherByCode(code)
    PL->>DR: GET vouchers
    PP->>QR: buildVietQrUrl(amount, email) → ảnh QR
    U->>PP: "Tôi đã chuyển khoản"
    PP->>PL: createPayment(...)
    PL->>DR: POST payments (status=pending, amount_vnd,<br/>voucher_id, discount_vnd, referrer_user_id, promo_link_id)
    PL->>DR: POST user_vouchers + PATCH vouchers.used_count
    ADM->>DR: đối soát → payments.status=verified,<br/>tạo/cập nhật account_types
```

### 4.8. Hồ sơ & mục tiêu học tập

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant DB as dashboard / onboarding
    participant PR as api/profile
    participant TG as api/target
    participant R as Directus REST
    participant F as Directus Flows

    U->>DB: mở dashboard
    DB->>PR: getProfile()
    PR->>R: GET /users/me + user_profiles
    DB->>TG: targets
    TG->>F: GET_TARGETS_FLOW
    F-->>DB: target_user[]
    U->>DB: cập nhật hồ sơ / mục tiêu / HSK level / chủ đề quan tâm
    DB->>F: UPDATE_PROFILE_FLOW · UPDATE_TARGET_USER_FLOW ·<br/>UPDATE_HSK_LEVEL_FLOW · UPDATE_TOPICS_OF_INTEREST_FLOW
```

---

## 5. Bảng mapping Module → Backend

| Module (`api/*`) | Transport | Collection / Endpoint | Page sử dụng |
| :-- | :-- | :-- | :-- |
| `apiService` | GraphQL + REST | `Sections`, `vocab_*`, `topic_of_exercise`, `link_exercise`; `/users/me`, `user_profiles` | dashboard |
| `courses` | REST | `course`, `course_chapters`, `course_lessons`, `lesson_theory`, `banners`, `vocab_display_map*` | courses, learn |
| `bilingual` | GraphQL | `Sections`, `genre_of_section`, `hsk_level`, `grammar_of_section`, `video_section` | bilingual |
| `stories` | GraphQL | `book_library`, `book_genre`, `book_library_book_genre`, `User_Reading_Progress` | stories |
| `video` | GraphQL | `video_genre`, `video_section` | video, quiz, subtitles |
| `notebook` | GraphQL | `flashcard_deck`, `flashcard_item`, `UserFlashcard`, `vocab_items`, `dictionary_levels` | flashcard |
| `vocabulary` | REST | `vocab_meanings`, `vocab_examples`, `lesson_theory`, `vocab_display_map_vocab_items` | flashcard, learn |
| `grammar` | GraphQL | `grammar_modules`, `grammar_item` | grammar |
| `speaking` | GraphQL | `speaking_topics`, `speaking_scenarios`, `speaking_dialogues` | speaking |
| `target` | GraphQL + Flow | `target_user`, `GET_TARGETS_FLOW`, `UPDATE_TARGET_USER_FLOW` | dashboard, onboarding |
| `profile` | REST + Flow | `user_profiles`, `ACCOUNT_TYPE_FLOW`, `UPDATE_PROFILE_FLOW` | dashboard, settings |
| `user` | GraphQL System | `delete_users` (system mutation) | settings |
| `plans` | REST | `account_plans`, `payments`, `vouchers`, `user_vouchers`, `account_types` | pricing |
| `segment` | Service | phân tách câu/từ (phục vụ subtitle/flashcard) | subtitles, flashcard |
| `authConfig` | Axios + GraphQL System | token interceptor, `auth_refresh` | toàn app |

## 6. Danh mục Directus Flows đang dùng

| Flow | Mục đích dữ liệu |
| :-- | :-- |
| `REGISTER_FLOW` | tạo tài khoản mới |
| `ONBOARDING_EMAIL_CHECK_FLOW` | kiểm tra email tồn tại |
| `RESET_PASSWORD_FLOW` | đặt lại mật khẩu |
| `ACCOUNT_TYPE_FLOW` | đọc trạng thái premium |
| `UPDATE_PROFILE_FLOW` | cập nhật hồ sơ |
| `GET_TARGETS_FLOW` / `UPDATE_TARGET_USER_FLOW` | đọc/ghi mục tiêu học |
| `UPDATE_TOPICS_OF_INTEREST_FLOW` | chủ đề quan tâm |
| `UPDATE_HSK_LEVEL_FLOW` | trình độ HSK |
| `SUBMIT_EXERCISE_FLOW` | nộp bài luyện tập |
| `EXERCISE_BY_ID_FLOW` | lấy đề bài |
| `EXERCISE_COUNT_BY_TOPIC_FLOW` / `..._BY_LESSON_AND_TOPIC_FLOW` | đếm số bài đã làm |
| `VOCAB_DETAIL_FLOW` | chi tiết từ điển |
| `ADD_NOTE_TO_VOCAB_FLOW` / `UPDATE_NOTE_VOCAB_FLOW` | ghi chú từ vựng |
| `FLASHCARD_DECK_VOCABS_FLOW` | từ vựng trong deck |

## 7. Dịch vụ ngoài

| Dịch vụ | Endpoint | Dữ liệu trao đổi |
| :-- | :-- | :-- |
| VietQR | `img.vietqr.io/image/...` | URL build từ `lib/payment.ts` → ảnh QR (amount + content) |
| Marutek Speech | `/api/speech/transcribe` (+`/base64`) | audio blob/base64 → transcript (zh-CN) |
| YouTube Data API v3 | `googleapis.com/youtube/v3` | thumbnail + metadata video |

---

*Cập nhật lần cuối: 2026-08-26 — sinh tự động từ audit codebase.*
