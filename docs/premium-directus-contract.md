# Contract: Dữ liệu Premium / Voucher / Affiliate — Web + Mobile (thống nhất qua Directus)

> Mục tiêu: trạng thái tài khoản **free / yearly / lifetime** là duy nhất và thống nhất giữa
> **webapp** và **mobile app**, lưu trên **Directus** (`https://marutek.space`).
> **RevenueCat chỉ là cổng thanh toán** (giao dịch mua trên mobile), mọi dữ liệu người dùng
> phải ghi lại vào Directus.
>
> ⚠️ **Không còn gói `monthly`.** Chuẩn hoá dữ liệu cũ: `monthly` → chuyển thành `yearly`
> hoặc `expired`.

---

## 1. Nguồn sự thật: bảng `account_types`

Trạng thái premium của user được đọc từ bảng `account_types` (mỗi user 1 dòng).

| Field | Kiểu | Ý nghĩa |
| :-- | :-- | :-- |
| `id` | int PK | |
| `user_id` | FK → `user_profiles.user_id` | User sở hữu gói |
| `type` | varchar | **Chỉ 3 giá trị**: `free` / `yearly` / `lifetime` |
| `expired_time` | datetime | Hết hạn. `yearly` = +365 ngày; `lifetime` = null (vĩnh viễn); `free` = null |
| `status` | varchar | `active` / `cancelled` / `expired` |
| `source` | varchar | Kênh thanh toán: `vietqr` (web) / `revenuecat` (mobile) / `manual` |
| `plan_id` | FK → `account_plans` | Gói cước tương ứng (yearly/lifetime) |
| `provider_transaction_id` | varchar | Mã giao dịch bên provider (RevenueCat transaction / mã VietQR) |

### Bảng lookup `is_premium` (canonical — dùng chung mobile + web)

Client xác định premium qua flow Directus `ACCOUNT_TYPE_FLOW_ID`, map theo `lib/premium.ts`:

| `account_types.type` | Premium? |
| :-- | :-- |
| `free`, `standard`, `basic` | ❌ |
| `premium`, `monthly`, `yearly`, `lifetime`, `weekly`, `trial` | ✅ (nếu `status=active` & chưa hết hạn) |
| khác / rỗng / không active | ❌ (mặc định an toàn — tránh cấp nhầm) |

---

## 2. Gói cước: bảng `account_plans`

| field | type | ghi chú |
| :-- | :-- | :-- |
| `id` | int PK | |
| `key` | varchar | `free` / `yearly` / `lifetime` |
| `name`, `name_trans` | varchar | tên hiển thị |
| `description` | text | |
| `price_vnd`, `original_price_vnd` | integer | giá (VND) |
| `duration_days` | integer | 0 = trọn đời |
| `is_premium` | boolean | nguồn chuẩn cho premium |
| `is_featured` | boolean | highlight "Phổ biến nhất" |
| `features` | text | mỗi ưu đãi 1 dòng |
| `upgrade_url` | varchar(500) | affiliate/checkout link mặc định |
| `sort` | integer | |
| `status` | varchar | chỉ `published` hiển thị |

### Seed gói mặc định

| key | name | price_vnd | original_price_vnd | duration_days | is_premium | is_featured | status |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| `free` | Miễn phí | 0 | 0 | 0 | ❌ | ❌ | published |
| `yearly` | Premium Năm | **599000** | 1188000 | 365 | ✅ | ✅ | published |
| `lifetime` | Premium Trọn đời | **999000** | 1990000 | 0 (vĩnh viễn) | ✅ | ❌ | published |

`features` ví dụ (mỗi dòng 1 dòng text): toàn bộ quyền lợi Premium, video/bài học không
giới hạn, đọc toàn bộ sách song ngữ, AI luyện nói, sổ tay từ vựng.

`price_vnd` / `original_price_vnd` có thể đổi trực tiếp trong Directus Content → account_plans.
`upgrade_url` để trống → web fallback `/pricing?plan=<key>`.

---

## 3. Giao dịch: bảng `payments`

| field | type | ghi chú |
| :-- | :-- | :-- |
| `id` | int PK | |
| `user_id` | uuid FK → `directus_users` | **người mua** |
| `plan_id` | int FK → `account_plans` | |
| `amount_vnd` | integer | số tiền phải chuyển (đã trừ giảm giá) |
| `discount_vnd` | integer | số tiền đã giảm bởi voucher |
| `voucher_id` | int FK → `vouchers` | voucher áp dụng (null nếu không dùng) |
| `status` | varchar | `pending` → `paid` → `verified` → `cancelled` |
| `transfer_content` | varchar | nội dung chuyển khoản (email) |
| `promo_link_id` | varchar | attribution nội dung/promo (vd `video-1`) |
| `referrer_user_id` | uuid FK → `directus_users` | **người cho link affiliate** |
| `verified_by` | uuid FK → `directus_users` | admin xác nhận |
| `verified_at` | timestamp | thời điểm verify |
| `date_created` | timestamp (auto) | |

---

## 4. Luồng thanh toán

### Web (VietQR — hiện tại)

1. `/pricing` → chọn gói → (tuỳ chọn) nhập mã **voucher**.
2. Web gọi `POST /api/payments` (Next.js route handler): **amount được tính lại server-side**
   từ plan + voucher — client không tự khai báo số tiền. Route tạo
   `payments(status=pending)` + `user_vouchers(used)` bằng bearer token của user,
   và chặn tạo trùng đơn pending cùng user+plan.
3. User chuyển khoản đúng số tiền + nội dung (email).
4. Admin flip `payments.status = verified` trong Directus panel → **Flow server-side**
   tự upsert `account_types` (`type=yearly|lifetime`, `expired_time`, `status=active`,
   `source=vietqr`) và tăng `vouchers.used_count`.
   Cấu hình Flow xem [`directus-flows-setup.md`](./directus-flows-setup.md).
5. User bấm "Làm mới Premium" ở card Lịch sử thanh toán trên `/pricing`
   (`refreshPremium(true)`) → mở khoá ngay, không cần chờ cache 5 phút.

Chi tiết vận hành admin xem [`thanh-toan-voucher-affiliate.md`](./thanh-toan-voucher-affiliate.md).

### Mobile (RevenueCat — cổng thanh toán)

1. Mobile dùng RevenueCat để xử lý giao dịch mua trong app.
2. Sau khi RevenueCat xác nhận giao dịch thành công, backend/mobile **phải ghi vào Directus**:
   cập nhật `account_types`: `type = yearly|lifetime`, `expired_time`, `status = active`,
   `source = revenuecat`, `provider_transaction_id = <revenuecat txn id>`.
3. Web đọc trạng thái qua flow `ACCOUNT_TYPE_FLOW` (không cần đổi) → cả 2 app luôn hiển thị cùng trạng thái.

> RevenueCat KHÔNG lưu trạng thái premium. Nó chỉ xác nhận "đã thanh toán";
> dữ liệu cuối cùng luôn nằm ở `account_types`.

---

## 5. Voucher & Affiliate

### `vouchers` — định nghĩa mã giảm giá

| field | type | ghi chú |
| :-- | :-- | :-- |
| `code` | varchar | mã học viên nhập (VD `THAYNAM20` — viết hoa không dấu) |
| `name` | varchar | tên tự đặt |
| `value` | float | giá trị giảm |
| `is_percent` | boolean | false = giảm `value` VND; true = giảm `value%` (làm tròn) |
| `max_uses` / `used_count` | int | giới hạn và đếm lượt dùng (**`used_count` tăng bởi Directus Flow** khi có `user_vouchers` mới — không phải client) |
| `valid_from` / `valid_until` | datetime | hạn sử dụng |
| `owner_user_id` | uuid | seeder/affiliate |
| `status` | varchar | chỉ `published` áp dụng được |

### `user_vouchers` — lịch sử user đã dùng mã nào

`user_id` (FK directus_users), `voucher_id` (FK vouchers), `payment_id` (FK payments),
`status` (`unused` / `used`).

### `affiliates` — tổng hợp affiliate theo người giới thiệu (mỗi dòng = 1 referrer)

| field | type | ghi chú |
| :-- | :-- | :-- |
| `user_id` | uuid FK → `directus_users` (unique) | người giới thiệu |
| `affiliate_url` | varchar | link giới thiệu |
| `referral_count` / `verified_count` / `pending_count` | integer | thống kê đơn |
| `earnings_vnd` | integer | tổng tiền đơn verified |

> Link giới thiệu **không lưu riêng** — tự sinh `{origin}/pricing?ref=<user_id>`
> (xem `buildAffiliateLink` trong `api/plans.ts`). Bảng `affiliates` là báo cáo tổng hợp
> đối soát từ `payments`.

### Affiliate link trên từng content

Thêm trực tiếp vào từng collection nội dung (`Sections`, `video_section`, `book_library`, `course`):

| field | type | ghi chú |
| :-- | :-- | :-- |
| `upgrade_url` | varchar(500) | checkout link riêng (vd `/pricing?plan=yearly&ref=book-123`) |
| `premium_promo_label` | varchar | label nút mở khóa (vd "Mở khóa Premium") |

Client ưu tiên `upgrade_url` của nội dung đang xem → fallback `account_plans.upgrade_url`
→ fallback `/pricing` (xem `buildCheckoutUrl` trong `api/plans.ts`).

---

## 6. Rule gate Free/Premium (giống CHINESE-LEARNING-APP)

| Tính năng | Rule | Điểm wire trong code |
| :-- | :-- | :-- |
| Bài tập | Free ≤ **2** bài (`FREE_EXERCISE_LIMIT`) | `courses/[id]/learn/page.tsx` |
| Truyện/Sách | chương 1 free, chương > 1 khóa | `stories/[id]/page.tsx` (`canAccessStoryChapter`) |
| Video chi tiết (vocab + shadowing) | gate toàn màn hình khi mount | `video/[id]` + quiz + subtitles |
| Bài đọc song ngữ | Free: `access_tier=free` hoặc HSK 1–3 | `bilingual/[id]` (`canAccessBilingualSection`) |
| AI luyện nói | chỉ xem transcript; chấm điểm = Premium | `speaking/page.tsx` |
| Sổ tay từ vựng | Free ≤ **1** (`FREE_NOTEBOOK_LIMIT`) | `flashcard/page.tsx` |

---

## 7. Permissions (Access Policies trong Directus Admin)

**Role `user`:**

| Collection | Action | Fields | Validation (khuyến nghị) |
| :-- | :-- | :-- | :-- |
| `account_plans` | read | `*` | — (public read nếu muốn hiện pricing khi chưa login) |
| `vouchers` | read | `*` | — |
| `user_vouchers` | create | `*` | — |
| `payments` | create + read | `*` | `user_id = $CURRENT_USER` |
| `account_types` | read | qua flow | — |

**Role admin:** `account_plans` (CRUD), `payments` (read/update — đối soát),
`account_types` (read/create/update), `vouchers` (CRUD), `affiliates` (read/update).

> ⚠️ Instance này cache permission: nếu web vẫn 403 sau khi cấp quyền qua API,
> mở policy trong **Directus Admin UI** và bấm Save lại — thao tác UI sẽ invalidate cache.
> Role `user` KHÔNG cần quyền update `vouchers` — `used_count` do Flow tăng.

---

## 8. Setup thủ công qua Directus Admin UI

Thực hiện thủ công theo các bước dưới (không dùng script).

1. **Settings → Data Model**: kiểm tra/tạo collection `account_plans`, `payments`,
   `vouchers`, `user_vouchers`, `affiliates` theo field table ở §2, §3, §5
   (`id` để Directus tự tạo — integer PK auto-increment).
   - Lưu ý Directus 11.x: tạo collection kèm field qua API chỉ tạo metadata, KHÔNG tạo bảng.
2. **Content → account_plans**: seed 3 gói theo bảng §2 (chỉ seed khi bảng trống).
3. **Content → vouchers / user_vouchers / affiliates**: tạo nếu dùng voucher/affiliate.
4. **Settings → Access Policies**: cấp quyền theo §7 cho role `user` + admin.
5. **Settings → Flows**: cấu hình 2 Flow kích hoạt premium + voucher count theo
   [`directus-flows-setup.md`](./directus-flows-setup.md).

---

## 9. Checklist & Troubleshooting

**Checklist hoạt động:**

- [ ] `account_plans` có gói published, đọc được bằng token user (`GET /items/account_plans` → 200).
- [ ] `POST /api/payments` tạo được đơn pending (amount server tính); gọi 2 lần cùng user+plan
      → lần 2 trả lại đơn cũ (`duplicate=true`).
- [ ] Web `/pricing` hiện danh sách gói + Lịch sử thanh toán; checkout VietQR hoạt động.
- [ ] Flip `payments.status=verified` → Flow tự cập nhật `account_types`.
- [ ] Tạo `user_vouchers` → `vouchers.used_count` tự tăng.
- [ ] User free: video gate khi mount; sách chương 2+ khóa; bài đọc HSK 4–6 khóa;
      speaking ẩn chấm điểm; flashcard ≤ 1 sổ tay; bài tập ≤ 2 bài.
- [ ] User có `account_types.type=yearly, status=active` → `is_premium=true`, không còn gate.

**Lỗi hay gặp:**

| Lỗi | Nguyên nhân | Xử lý |
| :-- | :-- | :-- |
| 403 khi đọc `account_plans` | thiếu quyền read (hoặc cache permission) | §7 + lưu policy qua UI |
| 401 khi POST `/api/payments` | token hết hạn/không hợp lệ | đăng nhập lại |
| 400 khi gửi voucher | voucher hết hạn/hết lượt/không tồn tại | §5 |
| Không thấy gói trên web | `account_plans` rỗng hoặc `status != published` | §2 |
| Voucher không tăng used_count | chưa cấu hình Flow 2 | [`directus-flows-setup.md`](./directus-flows-setup.md) |
| Verify xong user vẫn bị gate | chưa cấu hình Flow 1 hoặc cache premium 5' | bấm "Làm mới Premium" / §4 |
| User premium vẫn bị gate | `account_types` thiếu/`status` sai/`expired_time` quá khứ | §1, §4 |

---

*Cập nhật: 2026-08-26 — hợp nhất premium-affiliate-schema + premium-setup-directus-guide (đã xoá), bổ sung luồng /api/payments + Directus Flows.*
