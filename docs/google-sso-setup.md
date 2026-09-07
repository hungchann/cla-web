# Setup Google SSO — Đăng nhập bằng Google (Directus Native SSO)

> Web app (sunchinese.vn) + Directus (api.sunchinese.vn). **Không cần cài thêm thư viện auth** —
> dùng SSO có sẵn của Directus qua driver OpenID. Web chỉ có nút Google + route callback.

## 0. Kiến trúc bắt buộc: API trên cùng root domain

**Vấn đề:** ban đầu Directus chạy ở `marutek.space`, web ở `sunchinese.vn` → cookie session SSO
thuộc `marutek.space` là **third-party cookie** đối với web app → Chrome/blocker chặn →
`POST /auth/refresh` thiếu cookie → 400 `refresh token is required in either the payload or cookie`.

**Giải pháp đã áp dụng (trên VPS):** Directus được serve ở **`https://api.sunchinese.vn`**
(cùng root domain `sunchinese.vn` với web app) → cookie SSO là **same-site** → mọi browser
đều cho phép.

| Thành phần | URL |
|---|---|
| Directus API (web app dùng) | `https://api.sunchinese.vn` |
| Directus (URL cũ — mobile app vẫn dùng) | `https://marutek.space` (vẫn hoạt động) |
| Web app production | `https://sunchinese.vn` |

## 1. Luồng hoạt động

```
[Nút Google] → GET https://api.sunchinese.vn/auth/login/google
                 ?redirect=https://sunchinese.vn/auth/google/callback...
[Google]     → user chọn tài khoản, cấp quyền
[Directus]   → tìm user theo external_identifier (= email), set session cookie
               (domain api.sunchinese.vn — same-site với app)
             → redirect về https://sunchinese.vn/auth/google/callback
[Web]        → POST https://api.sunchinese.vn/auth/refresh (credentials: include)
               → nhận access_token + refresh_token → lưu cookie + user_data
             → redirect về /dashboard (hoặc ?redirect= ban đầu)
```

## 2. Cấu hình đã làm trên VPS (14.225.212.158)

- nginx vhost `/etc/nginx/sites-available/api.sunchinese.vn` → proxy `:8055` (+ mirror các
  service `/api/chinese/`, `/api/speech/`, `/smtp-auth/`, `/datn/`).
- Docker compose `/root/Directus/directus_education/docker-compose.yml`:
  `PUBLIC_URL=https://api.sunchinese.vn` (backup: `docker-compose.yml.sso-bak-20260907`).
- Env SSO: `AUTH_GOOGLE_*` (driver openid, IDENTIFIER_KEY=email, MODE=session,
  ALLOW_PUBLIC_REGISTRATION, DEFAULT_ROLE_ID=acb1ce40-...), CORS reflect + credentials,
  session/refresh cookie SameSite=None + Secure.

## 3. Việc còn lại cần làm (bên ngoài VPS)

### 3.1. DNS (Cloudflare của sunchinese.vn)

Thêm record:

| Type | Name | Content | Proxy |
|---|---|---|---|
| A | `api` | `14.225.212.158` | Proxied (như marutek.space) |

Sau khi DNS live → chạy certbot cấp HTTPS cho origin (chỉ cần chạy 1 lần, tôi sẽ chạy:
`certbot --nginx -d api.sunchinese.vn`).

### 3.2. Google Cloud Console

**Credentials → OAuth client** → Authorized redirect URIs, thêm:

```
https://api.sunchinese.vn/auth/login/google/callback
```

(khớp chính xác từng ký tự — Directus build từ `PUBLIC_URL`.)

## 4. Gộp tài khoản theo email — TỰ ĐỘNG (đã patch) + GIỮ CẢ 2 CÁCH ĐĂNG NHẬP

Directus mặc định chỉ match qua `external_identifier` và **từ chối** khi email trùng user
password (`RECORD_NOT_UNIQUE`). Repo đã patch `patches/openid.js` (mount vào container) để
**tự động gộp**: identifier chưa tồn tại + email trùng user hiện có → set
`provider=google` + `external_identifier` cho user đó → login Google vào đúng tài khoản cũ.

- Bật/tắt: env `AUTH_GOOGLE_LINK_BY_EMAIL` (mặc định `true`).
- Bảo vệ trong patch: bỏ qua tài khoản admin (`directus_roles.admin_access`), yêu cầu
  `email_verified` từ Google.
- Log khi link: `[OpenID] Auto-linked existing user ...` trong `docker logs`.
- ⚠️ Khi nâng cấp Directus: kiểm tra diff `patches/openid.js` với bản mới, cập nhật lại patch.

### Dual login (password + Google cùng 1 tài khoản) — ĐÃ HOẠT ĐỘNG

`patches/authentication.js` (dòng ~78) có escape hatch: cho phép login password qua provider
`default` cho user đã gộp (`provider=google`) **nếu user còn password hash**:

```
if (user?.status !== 'active' ||
    (user?.provider !== providerName && !(providerName === 'default' && user?.password)))
```

Đã verify end-to-end (07/09/2026): tạo user test → login password 200 → set
`provider=google` → login password **vẫn 200** ✓. User Google tạo mới (không có password)
vẫn bị chặn password login ✓ đúng kỳ vọng.

## 4b. Pin IP Google (VPS VN → Google flaky)

VPS Việt Nam route tới một số dải IP Google bị timeout → token exchange/ngày gửi mail
random fail (`ETIMEDOUT` trong log). Giải pháp:

1. **Pin IP ổn định** vào `/etc/hosts` container qua `extra_hosts` (compose):
   `accounts.google.com → 74.125.204.84`, `openidconnect.googleapis.com → 172.217.119.4`,
   `smtp.gmail.com → 142.250.157.108`.
2. **Auto-heal** `google-ip-heal.sh` (cron 5'): test pin hiện tại từ trong container;
   nếu fail → probe DNS 8.8.8.8/1.1.1.1, TCP-test từng candidate, repin IP mới, log ra
   `ip-pin-heal.log`. Chỉnh sửa `/etc/hosts` trực tiếp KHÔNG sống qua `docker compose up -d`
   (recreate) — script sẽ heal lại trong 5 phút sau đó.
3. Khi SSO/mail đột nhiên lỗi `ETIMEDOUT`: xem `ip-pin-heal.log`; nếu heal không tự xử lý
   được, chạy tay: `bash /root/Directus/directus_education/google-ip-heal.sh`.

## 5. `user_profiles` cho user Google mới — TỰ ĐỘNG (đã patch)

User tạo mới bởi SSO trước đây không có row `user_profiles` (bypass luồng register Flow) →
flow premium trả rỗng (free, đúng mặc định) nhưng profile/HSK/targets bị null.

**Đã patch** `patches/openid.js`: ngay sau khi tạo user qua SSO, tự tạo
`user_profiles { user_id, notification_enabled: true }` (date_created tự fill bởi special
`date-created`). Lỗi tạo profile được nuốt (warn log) để không hỏng login. Verify: đăng nhập
Google bằng Gmail hoàn toàn mới → `user_profiles` xuất hiện ngay.

## 6. Checklist test (sau khi DNS + Google URI xong)

1. Dev: `.env.local` đã trỏ `NEXT_PUBLIC_API_URL=https://api.sunchinese.vn`.
2. `localhost:3020/sign-in` → nút **Tiếp tục với Google** → Google → quay lại callback →
   vào `/dashboard` → user mới hiện trong Directus (provider=google).
3. Đăng xuất → login Google lại → vào thẳng.
4. Login Google bằng email **đã đăng ký password** → lỗi (đúng thiết kế) → link theo mục 4
   → login lại → vào đúng tài khoản cũ.
5. Test trên production `sunchinese.vn` sau deploy.

> **Dev trên localhost:** `localhost` vẫn là cross-site với `api.sunchinese.vn` → nếu Chrome
> chặn 3P cookie, vào `chrome://settings/cookies` → "Sites allowed to use third-party
> cookies" → thêm `[*.]sunchinese.vn`. Production (sunchinese.vn) không cần — same-site sẵn.

## 7. Troubleshooting

| Hiện tượng | Nguyên nhân |
|---|---|
| `redirect_uri_mismatch` (Google) | Chưa thêm URI `https://api.sunchinese.vn/auth/login/google/callback` vào Google Cloud |
| DNS không resolve `api.sunchinese.vn` | Chưa thêm record A (mục 3.1) hoặc chưa truyền ra ngoài |
| ERR_CERT / 526 (Cloudflare) | Chưa chạy certbot cho origin → báo tôi chạy |
| 400 `refresh token is required` | Cookie không được gửi: kiểm tra app có đang gọi đúng `api.sunchinese.vn` (không phải marutek.space), và Chrome cho phép cookie site này |
| `INVALID_USER` / `RECORD_NOT_UNIQUE` | Email đã tồn tại chưa link — mục 4 |
| 404 `/auth/login/google` | Directus chưa restart với env mới |

## 8. File liên quan trong repo

| File | Vai trò |
|---|---|
| `components/auth/GoogleButton.tsx` | Nút "Tiếp tục với Google" (sign-in + register) |
| `app/(auth)/auth/google/callback/page.tsx` | Nhận redirect từ Directus, đổi session → token |
| `api/apiService.ts` → `exchangeGoogleSession()` | POST `/auth/refresh` (mode json) + lưu token + user |
| `proxy.ts` | Bỏ qua guard cho `/auth/google/callback` |
| `.env.local` | `NEXT_PUBLIC_API_URL=https://api.sunchinese.vn` |
