# API Reference — cla-web

> Sơ đồ luồng dữ liệu tổng thể xem [`architecture.md`](./architecture.md).
> File này liệt kê **endpoint cụ thể** dùng khi tích hợp/debug.

Backend chính: Directus @ `https://marutek.space` (`NEXT_PUBLIC_API_URL`).

---

## 1. Auth & User (REST)

Client tại `api/authConfig.ts` — tự gắn Bearer token, retry lỗi mạng/5xx, tự refresh khi 401.

| Method | Endpoint | Chức năng |
| :-- | :-- | :-- |
| POST | `/auth/login` | Đăng nhập |
| POST | `/auth/forgot-password` | Quên mật khẩu |
| POST | `/graphql/system` | Làm mới token (`auth_refresh`) |
| GET | `/users/me` | Thông tin người dùng |
| GET | `/items/user_profiles` | Hồ sơ người dùng |
| PATCH | `/items/user_profiles/:id` | Cập nhật hồ sơ (`api/profile.ts`) |
| POST | `/files` | Upload file (multipart) |

## 2. GraphQL

Client tại `api/graphql/client.ts`:
- `graphqlRequest` → `POST /graphql` (nội dung học)
- `graphqlRequestSystem` → `POST /graphql/system` (system mutation: `delete_users`, `auth_refresh`)

Phân bổ theo module xem bảng mapping trong [`architecture.md`](./architecture.md#5-bảng-mapping-module--backend).

## 3. Directus Flows

Gọi qua `/flows/trigger/<id>`, UUID định nghĩa tại `lib/constants.ts`.
Danh mục 17 flows xem [`architecture.md`](./architecture.md#6-danh-mục-directus-flows-đang-dùng).

## 4. API AI (Marutek)

| Method | Endpoint | Chức năng | File |
| :-- | :-- | :-- | :-- |
| GET | `/api/chinese/translate` | Dịch từ tiếng Trung | `api/apiService.ts` |
| POST | `/api/chinese/segment` | Tách từ | `api/segment.ts` |
| POST | `/api/speech/transcribe` | Speech-to-text (multipart) | `services/marutekTranscribeService.ts` |
| POST | `/api/speech/transcribe/base64` | STT fallback JSON `{ audioBase64 }` | `services/marutekTranscribeService.ts` |

> Mọi request AI đi qua `services/aiRequestService.ts` → `aiConsentGate.ts`:
> bị chặn cho tới khi người dùng đồng ý chia sẻ dữ liệu (`AIConsentRequiredError`).
> Backend AI dùng OpenAI phía sau Marutek.

## 5. Service nội bộ (`services/`)

| Service | Vai trò |
| :-- | :-- |
| `aiRequestService.ts` | Gate consent cho mọi request AI |
| `aiConsentGate.ts` / `aiConsentErrors.ts` | Kiểm tra/hiển thị consent + error type |
| `marutekTranscribeService.ts` | Speech-to-text (multipart/base64) |
| `audioRecordingService.ts` | Ghi âm microphone |
| `audioFeedback.ts` | Phát âm thanh phản hồi |
| `textComparisonService.ts` | So sánh văn bản (chấm phát âm) |
| `subtitle/index.ts` | Xử lý phụ đề video |
| `logger.ts` | Logging tập trung |

## 6. Dịch vụ bên thứ ba

| Dịch vụ | Mục đích |
| :-- | :-- |
| VietQR (`img.vietqr.io`) | Sinh ảnh QR chuyển khoản (`lib/payment.ts`) |
| YouTube Data API v3 | Thumbnail + metadata video (`NEXT_PUBLIC_YOUTUBE_API_KEY`) |
| Marutek | Dịch, tách từ, STT (gián tiếp OpenAI) |
