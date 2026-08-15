# Hướng Dẫn Setup Directus cho Luồng Free / Premium + Affiliate (Upgrade Link)

Guide từng bước để setup **toàn bộ phần content** trên Directus (`https://marutek.space/admin`)
nhằm đảm bảo luồng free/premium hoạt động đúng logic đã đề ra, kèm data model chuẩn.

> ✅ `scripts/setup-premium-schema.js` tự tạo collection (bảng thật), thêm field, seed gói, cấp quyền.
> ⚠️ Lưu ý Directus 11.x: `POST /collections` **kèm field** chỉ tạo metadata, KHÔNG tạo bảng. Script đã xử lý
> bằng cách tạo collection tối giản rồi thêm field riêng (POST /fields). Nếu cần tạo tay, dùng §1b.

---

## 1. Mô hình dữ liệu (data model)

```
account_plans  (gói cước — nguồn chuẩn premium + giá + upgrade link)
  id (PK), key, name, name_trans, description,
  price_vnd, original_price_vnd, duration_days,
  is_premium (bool), is_featured (bool),
  features (text, mỗi dòng 1 ưu đãi),
  upgrade_url, sort, status (published/draft/archived)

payments  (giao dịch thanh toán VietQR — chờ admin xác nhận)
  id (PK), user_id (FK→directus_users), plan_id (FK→account_plans),
  amount_vnd, status (pending/paid/verified/cancelled),
  transfer_content (email), promo_link_id,
  referrer_user_id (FK→directus_users),   ← người cho link affiliate
  verified_by, verified_at, date_created

affiliates  (tổng hợp affiliate theo người giới thiệu — refresh bằng script)
  id (PK), user_id (FK→directus_users, unique), affiliate_url,
  referral_count, verified_count, pending_count, earnings_vnd, date_updated

account_types  (đã có — trạng thái premium của user)
  id, user_id (FK→user_profiles), type (free/monthly/yearly/lifetime),
  expired_time, status (active/cancelled/expired), source (vietqr/manual/revenuecat)

Nội dung (Sections, video_section, book_library, course) — thêm:
  upgrade_url (varchar500)      ← affiliate/checkout link riêng cho từng content
  premium_promo_label (varchar) ← label nút mở khóa
```

**Quy ước `is_premium` theo `account_types.type`:**

| `type` | Premium? |
|---|---|
| `free`, `standard`, `basic` | ❌ |
| `premium`, `monthly`, `yearly`, `lifetime`, `weekly`, `trial` | ✅ (nếu `status=active` & chưa hết hạn) |
| khác / rỗng | ❌ |

---

## 1b. Tạo 3 collection (nếu cần tạo tay)

Thường thì chạy `node scripts/setup-premium-schema.js` là đủ (tự tạo bảng thật + field + seed + quyền).
Nếu phải tạo tay: vào **Settings → Data Model → Create Collection**. `id` để Directus tự tạo (integer PK auto-increment).

**`account_plans`:**
| field | type | note |
|---|---|---|
| `key` | String | `free / monthly / yearly / lifetime` |
| `name` | String | tên hiển thị |
| `name_trans` | String | tên tiếng Anh |
| `description` | Text | |
| `price_vnd` | Integer | giá bán |
| `original_price_vnd` | Integer | giá gốc |
| `duration_days` | Integer | 0 = trọn đời |
| `is_premium` | Boolean (default true) | gói này là Premium |
| `is_featured` | Boolean | highlight |
| `features` | Text | mỗi ưu đãi 1 dòng |
| `upgrade_url` | String | link checkout mặc định |
| `sort` | Integer | |
| `status` | String (published/draft/archived) | chỉ published hiển thị |

**`payments`:**
| field | type | note |
|---|---|---|
| `user_id` | UUID, Relational → `directus_users` | người mua |
| `plan_id` | Integer, Relational → `account_plans` | |
| `amount_vnd` | Integer | |
| `status` | String (pending/paid/verified/cancelled, default pending) | |
| `transfer_content` | String | nội dung chuyển khoản (email) |
| `promo_link_id` | String | attribution nội dung |
| `referrer_user_id` | UUID, Relational → `directus_users` | người giới thiệu |
| `verified_by` | UUID, Relational → `directus_users` | admin |
| `verified_at` | Timestamp | |
| `date_created` | Timestamp (auto) | |

**`affiliates`:**
| field | type | note |
|---|---|---|
| `user_id` | UUID, Relational → `directus_users` (Unique) | người giới thiệu |
| `affiliate_url` | String | link giới thiệu |
| `referral_count` | Integer (default 0) | |
| `verified_count` | Integer (default 0) | |
| `pending_count` | Integer (default 0) | |
| `earnings_vnd` | Integer (default 0) | |
| `date_updated` | Timestamp (auto) | |

Tạo xong → chạy lại `node scripts/setup-premium-schema.js` để thêm field còn thiếu + cấp quyền + seed.

---



## 2. Seed dữ liệu gói cước (`account_plans`)

Vào **Content → account_plans** → nhập 4 dòng sau (script seed 4 gói này nếu bảng trống):

| key | name | price_vnd | original_price_vnd | duration_days | is_premium | is_featured | status |
|---|---|---|---|---|---|---|---|
| `free` | Miễn phí | 0 | 0 | 0 | ❌ | ❌ | published |
| `monthly` | Premium Tháng | 99000 | 149000 | 30 | ✅ | ❌ | published |
| `yearly` | Premium Năm | 499000 | 1188000 | 365 | ✅ | ✅ | published |
| `lifetime` | Premium Trọn đời | 999000 | 1990000 | 0 | ✅ | ❌ | published |

`features` (mỗi dòng 1 ưu đãi), ví dụ gói `yearly`:
```
Tất cả quyền lợi Premium
Video & bài học không giới hạn
Đọc toàn bộ sách song ngữ
AI luyện nói không giới hạn
Sổ tay từ vựng không giới hạn
```

`upgrade_url` để trống → web dùng fallback `/pricing?plan=<key>`. Nếu có checkout riêng
(VD VietQR page tĩnh) thì điền URL vào đây.

---

## 3. Affiliate / upgrade link trên từng content

Với từng item thuộc `Sections`, `video_section`, `book_library`, `course`:

- **`upgrade_url`**: link mở khóa khi user Free gặp gate. Ưu tiên theo thứ tự:
  `content.upgrade_url` → `account_plans.upgrade_url` (gói được chọn) → `/pricing`.
  - VD: `/pricing?plan=yearly&ref=video-abc123`
  - VD affiliate: `https://partner.example/checkout?plan=yearly&ref=you`
- **`premium_promo_label`**: text nút, VD `Mở khóa Premium`, `Xem toàn bộ sách`.

> Có thể để trống (fallback `/pricing`), nhưng điền `upgrade_url` để theo dõi affiliate `ref`
> → lưu vào `payments.promo_link_id`.

---

## 4. Kích hoạt Premium cho user (`account_types`)

Khi admin xác nhận chuyển khoản:

1. **Content → payments**: tìm bản ghi `status=pending`, đối soát `transfer_content` (email)
   + `amount_vnd`, đổi `status=verified`, điền `verified_by`/`verified_at`.
2. **Content → account_types**: tạo/update dòng cho user:
   - `user_id` = user_profiles.id của user
   - `type` = `monthly` / `yearly` / `lifetime` (khớp `plan.key`)
   - `expired_time` = ngày hết hạn (`lifetime` → để trống/ngày xa)
   - `status` = `active`
   - `source` = `vietqr`

Web user bấm nút refresh (hoặc load lại) → `PremiumProvider` đọc `ACCOUNT_TYPE_FLOW` → `is_premium=true`.

---

## 5. Quyền truy cập (Access Policies)

**Settings → Access Policies** → chọn/chỉnh policy của **role `user`** (hoặc tạo policy mới và
link vào role user), thêm quyền **items**:

| Collection | Action | Fields | Validation (khuyến nghị) |
|---|---|---|---|
| `account_plans` | read | `*` | — |
| `payments` | create | `*` | `user_id` = `$CURRENT_USER` |
| `payments` | read | `*` | `user_id` = `$CURRENT_USER` |

> Trong `payments`, khi mua qua **link giới thiệu (affiliate)**: `user_id` = người mua,
> `referrer_user_id` = người cho link, `promo_link_id` = nội dung/promo (vd `video-1`).

Role admin cần: `account_plans` (read/create/update/delete), `payments` (read/update), `account_types` (read/create/update),
`affiliates` (read/update — nếu dùng báo cáo tổng hợp).

> ⚠️ Nếu web vẫn 403 khi đọc `account_plans` (instance này cache permission), hãy **lưu lại policy
> qua UI** (mở + chỉnh + Save) — thao tác qua UI sẽ invalidate cache, thay vì chỉ tạo qua API.

---

## 6. Quản lý Affiliate trong Directus (Content)

### Nguyên tắc
- **Link giới thiệu không lưu riêng** — tự sinh: `{origin}/pricing?ref=<user_id>`.
  User xem link của mình ở trang `/pricing` (card "Link giới thiệu (Affiliate)").
- Mỗi giao dịch trong `payments` ghi đủ:
  - `user_id` = **người mua** (ai đăng ký)
  - `referrer_user_id` = **người cho link affiliate** (ai giới thiệu)
  - `promo_link_id` = nội dung/promo dẫn tới (vd `video-1`)

### Xem chi tiết: Content → `payments`
Mỗi dòng = 1 đơn thanh toán. Các cột quan trọng:
`user_id` (người mua, hiện email) · `referrer_user_id` (người giới thiệu, hiện email) ·
`plan_id` · `amount_vnd` · `status` (Pending/Paid/Verified/Cancelled) · `promo_link_id`.

- **Xem ai giới thiệu ai**: lọc cột `referrer_user_id` (Filter → referrer_user_id → _eq → chọn user).
- **Xem ai mua qua link mình**: dùng "Advanced search" `referrer_user_id = <user_id>`.
- **Đối soát**: sort theo `status` để xử lý các đơn `pending` trước.

### Xem tổng hợp: Content → `affiliates`
Mỗi dòng = 1 người giới thiệu, gồm `referral_count`, `verified_count`, `pending_count`,
`earnings_vnd`, `affiliate_url`. Cập nhật bằng tool:

```bash
# Sau khi cấp quyền (read payments + read/write affiliates):
node scripts/affiliate-report.js
```

Có thể đặt chạy định kỳ (cron) hoặc bấm thủ công sau khi xác nhận đơn.

### Luồng admin vận hành affiliate
1. User A chia sẻ link `/pricing?ref=<A_id>`.
2. B bấm link → mua → `payments` có `user_id=B`, `referrer_user_id=A`.
3. Admin vào Content → `payments` đối soát → `verified`.
4. Chạy `node scripts/affiliate-report.js` → `affiliates` của A tăng `verified_count`/`earnings_vnd`.
5. A xem thành tích: xem dòng của mình trong `affiliates` (hoặc web hiển thị sau).

---

## 7. Kiểm tra & Troubleshooting

**Checklist hoạt động:**
- [ ] `account_plans` có 4 gói published, đọc được bằng token user (`GET /items/account_plans` → 200).
- [ ] `payments` tạo được bằng token user (`POST /items/payments` → 200).
- [ ] Web `/pricing` hiện danh sách gói; user free chọn gói → checkout VietQR → gửi `payments`.
- [ ] User free: video → gate mở khi mount; sách → chương 2+ khóa; speaking → ẩn chấm điểm chi tiết;
      flashcard → tạo ≤1 sổ tay.
- [ ] User có `account_types.type=yearly, status=active` → `is_premium=true`, không còn gate.

**Lỗi hay gặp:**
| Lỗi | Nguyên nhân | Xử lý |
|---|---|---|
| 403 khi đọc `account_plans` | thiếu quyền read (hoặc cache permission) | §5 + lưu policy qua UI |
| 403 khi POST `payments` | thiếu quyền create trên `payments` | §5 |
| Không thấy gói trên web | `account_plans` rỗng hoặc `status != published` | §2 |
| User premium vẫn bị gate | `account_types` thiếu/`status` sai/`expired_time` quá khứ | §4 |
| Nút nâng cấp sai link | chưa điền `upgrade_url` | §3 |
