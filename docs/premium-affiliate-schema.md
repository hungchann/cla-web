# Premium / Free + Affiliate (Upgrade Link) — Data Model & Deploy

Tài liệu này mô tả data model cho hệ thống **tài khoản Free/Premium** và **affiliate/upgrade link** trên Directus (`https://marutek.space`), cách đồng bộ với mobile `CHINESE-LEARNING-APP`, và cách triển khai cho web (`cla-web`).

---

## 1. Nguồn trạng thái Premium

- **`account_types`** (đã có) — xác định user có premium hay không:
  - `id`, `user_id` (FK → `user_profiles`), `type` (varchar: `free | monthly | yearly | lifetime`), `expired_time` (datetime).
  - **Thêm** (bằng `scripts/setup-premium-schema.js`):
    - `status` (`active | cancelled | expired`, default `active`)
    - `source` (`vietqr | manual | revenuecat`)
- Web/mobile xác định premium qua **flow Directus** `ACCOUNT_TYPE_FLOW_ID` → response
  `{ id, user_id, expired_time, type }`. Client map `type` → `is_premium` theo bảng lookup dưới đây.

**Bảng lookup `is_premium` (canonical — dùng chung mobile + web):**

| `type` | `is_premium` |
|---|---|
| `free`, `standard`, `basic` | false |
| `premium`, `monthly`, `yearly`, `lifetime`, `weekly`, `trial` | true |
| khác / rỗng / không active | false (an toàn) |

---

## 2. Collection MỚI

### `account_plans` — định nghĩa gói cước + upgrade link
| field | type | ghi chú |
|---|---|---|
| `id` | int PK | |
| `key` | varchar | `free / monthly / yearly / lifetime` |
| `name`, `name_trans` | varchar | tên hiển thị |
| `description` | text | |
| `price_vnd`, `original_price_vnd` | integer | giá (VND) |
| `duration_days` | integer | 0 = trọn đời |
| `is_premium` | boolean | nguồn chuẩn cho premium |
| `is_featured` | boolean | highlight “Phổ biến nhất” |
| `features` | text | mỗi ưu đãi 1 dòng |
| `upgrade_url` | varchar | **affiliate/checkout link mặc định** |
| `sort` | integer | |
| `status` | varchar | chỉ `published` hiển thị |

### `payments` — ghi nhận thanh toán VietQR (chờ admin xác nhận)
| field | type | ghi chú |
|---|---|---|
| `id` | int PK | |
| `user_id` | uuid FK → `directus_users` | **người mua / người đăng ký** |
| `plan_id` | int FK → `account_plans` | |
| `amount_vnd` | integer | |
| `status` | varchar | `pending → paid → verified → cancelled` |
| `transfer_content` | varchar | nội dung chuyển khoản (email) |
| `promo_link_id` | varchar | **attribution nội dung/promo** (vd `video-1`) |
| `referrer_user_id` | uuid FK → `directus_users` | **người cho link affiliate (referrer)** |
| `verified_by` | uuid FK → `directus_users` | admin xác nhận |
| `verified_at` | timestamp | |

### `affiliates` — tổng hợp affiliate theo người giới thiệu (mỗi dòng = 1 referrer)
| field | type | ghi chú |
|---|---|---|
| `id` | int PK | |
| `user_id` | uuid FK → `directus_users` (unique) | người giới thiệu |
| `affiliate_url` | varchar | link giới thiệu |
| `referral_count` | integer | tổng đơn có referrer |
| `verified_count` | integer | đơn đã verified |
| `pending_count` | integer | đơn pending |
| `earnings_vnd` | integer | tổng tiền đơn verified |

> Refresh bằng `node scripts/affiliate-report.js` (đọc `payments` → ghi đè `affiliates`).

---

## 3. Field MỚI trên collection nội dung (affiliate link per content)

Thêm trực tiếp vào từng collection nội dung (đơn giản, không cần `promo_links`):

`Sections`, `video_section`, `book_library`, `course`

| field | type | ghi chú |
|---|---|---|
| `upgrade_url` | varchar(500) | checkout link riêng (vd `/pricing?plan=yearly&ref=book-123`) |
| `premium_promo_label` | varchar | label nút mở khóa (vd “Mở khóa Premium”) |

Client ưu tiên `upgrade_url` của nội dung đang xem → fallback `account_plans.upgrade_url` → fallback `/pricing`.

---

## 4. Rule gate (giống CHINESE-LEARNING-APP)

| Tính năng | Rule |
|---|---|
| Bài tập | Free ≤ **2** bài (`FREE_EXERCISE_LIMIT`) |
| Truyện/Sách | chương 1 free, chương > 1 khóa |
| Video chi tiết (vocab + shadowing) | gate toàn màn hình khi mount |
| AI luyện nói | chỉ xem transcript; chấm điểm = Premium |
| Sổ tay từ vựng | Free ≤ **1** (`FREE_NOTEBOOK_LIMIT`) |
| Tra từ nâng cao | `guardPremium` |

---

## 5. Deploy Web (`cla-web`)

1. **PremiumProvider** — `lib/context/PremiumContext.tsx` (wrapped ở root layout):
   - Đọc `getAccountType()` (flow) → `is_premium` theo bảng lookup.
   - Cache per-user localStorage (`cla_premium_status`, TTL 5 phút, scoped `userId`).
   - API: `{ isPremium, loading, refreshPremium, accountTypeName }`.
2. **`usePremium()`** — đọc từ context (fallback tự fetch khi không có provider, giữ test cũ xanh).
3. **`usePremiumGate()`** — mirror mobile (`showOnMount`, `guardPremium`, `isLocked`).
4. **`/pricing`** — `app/(app)/pricing/page.tsx`:
   - Không đăng nhập → intro gói + CTA đăng nhập.
   - Đăng nhập + chọn gói → checkout VietQR (`img.vietqr.io`), tạo `payments` (pending), chờ admin verify.
   - Đọc `account_plans` qua `api/plans.ts`.
5. **`PremiumGate`** — CTA dùng `upgradeUrl` (content → plan → `/pricing`).
6. Đã gắn gate tại: `video/[id]`, `speaking`, `stories/[id]`, `flashcard`.

---

## 6. Chạy setup schema

```bash
$env:DIRECTUS_ADMIN_EMAIL="admin@marutek.space"
$env:DIRECTUS_ADMIN_PASSWORD="***"
node scripts/setup-premium-schema.js
```

Script sẽ: kiểm tra/ tạo bảng thật của `account_plans`/`payments`/`affiliates` (tạo collection tối giản rồi thêm field — tránh bug Directus 11 không tạo bảng khi kèm field), thêm `upgrade_url`/`premium_promo_label` vào collection nội dung, thêm `status`/`source` vào `account_types`, seed gói mặc định, và tạo permission (policy + link role `user`).

> ⚠️ **Lưu ý instance này**: một số Directus instance (như `marutek.space`) **cache permission** và không áp dụng ngay thay đổi qua API — kể cả sau `POST /utils/cache/clear`. Nếu web vẫn trả 403 khi đọc `account_plans`, hãy cấp quyền thủ công trong **Directus Admin UI** (Settings → Access Policies):

| Collection | Action | Cho ai | Ghi chú |
|---|---|---|---|
| `account_plans` | `read` | role `user` (và public nếu muốn hiện pricing khi chưa login) | fields `*` |
| `payments` | `create` | role `user` | fields `*`; nên thêm validation `user_id` = `$CURRENT_USER` |
| `payments` | `read`/`update` | role admin | để đối soát |

Seed gói cước: nếu bước seed bị 403, thêm thủ công trong **Directus Admin → Content → account_plans** (hoặc chạy lại script sau khi cấp quyền — nó chỉ seed nếu bảng trống).

---

## 7. Luồng kích hoạt Premium (VietQR manual) + Affiliate

**Affiliate (link giới thiệu):**
1. User A đã đăng nhập → vào `/pricing` → thấy **Link giới thiệu** `{origin}/pricing?ref=<A_id>` → sao chép chia sẻ.
2. User B bấm link → `/pricing?ref=<A_id>` → web lưu referrer (localStorage `cla_referrer`).
3. B chọn gói → checkout VietQR → tạo `payments` với:
   - `user_id` = B (người mua)
   - `referrer_user_id` = A (người cho link)
   - `promo_link_id` = promo nội dung (nếu vào từ content, vd `video-1`)
4. Admin đối soát → `status=verified` → tạo `account_types` cho B.
5. B refresh → `is_premium = true`.

**Quy trình admin:**
1. User free gặp gate → bấm nâng cấp → `/pricing`.
2. Chọn gói → nhập email (nội dung chuyển khoản) → QR VietQR.
3. User chuyển khoản → bấm “Tôi đã chuyển khoản” → tạo `payments(status=pending)`.
4. Admin trong Directus đối soát → `payments.status=verified` **và** tạo/update `account_types`
   (`type`, `expired_time`, `status=active`, `source=vietqr`).
5. User quay lại web → PremiumProvider `refreshPremium()` → `isPremium = true`.
