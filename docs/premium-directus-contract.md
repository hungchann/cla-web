# Contract: Dữ liệu Premium — Web + Mobile (thống nhất qua Directus)

> Mục tiêu: trạng thái tài khoản **free / yearly / lifetime** là duy nhất và thống nhất giữa
> **webapp** và **mobile app**, lưu trên **Directus**. **RevenueCat chỉ là cổng thanh toán**
> (giao dịch mua trên mobile), mọi dữ liệu người dùng phải ghi lại vào Directus.

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

**Quy tắc `isPremium`:** `status = active` và (`type` thuộc {yearly, lifetime}) và
(`expired_time` null hoặc > now).

> **Không có** gói `monthly` nữa. Chuẩn hoá dữ liệu cũ: `monthly` → chuyển thành `yearly`
> hoặc `expired` (chạy `scripts/setup-premium-schema.js` đã archive gói monthly trong account_plans).

---

## 2. Gói cước: bảng `account_plans`

| key | name | price_vnd | duration_days | is_premium | is_featured |
| :-- | :-- | :-- | :-- | :-- | :-- |
| `free` | Miễn phí | 0 | 0 | false | false |
| `yearly` | Premium Năm | **599.000** | 365 | true | true |
| `lifetime` | Premium Trọn đời | **999.000** | 0 (vĩnh viễn) | true | false |

`price_vnd` / `original_price_vnd` có thể đổi trực tiếp trong Directus Content → account_plans.

---

## 3. Luồng thanh toán

### Web (VietQR — hiện tại)
1. `/pricing` → chọn gói → (tuỳ chọn) nhập mã **voucher** → tạo bản ghi `payments(status=pending)`.
2. User chuyển khoản đúng số tiền + nội dung (email).
3. Admin xác nhận trong Directus → tạo/cập nhật `account_types` (`type=yearly|lifetime`, `expired_time`, `status=active`, `source=vietqr`).

### Mobile (RevenueCat — cổng thanh toán)
1. Mobile dùng RevenueCat để xử lý giao dịch mua trong app.
2. Sau khi RevenueCat xác nhận giao dịch thành công, backend/mobile **phải ghi vào Directus**:
   - Cập nhật `account_types`: `type = yearly|lifetime`, `expired_time`, `status = active`, `source = revenuecat`, `provider_transaction_id = <revenuecat txn id>`.
3. Web đọc trạng thái qua flow `ACCOUNT_TYPE_FLOW` (không cần đổi) → cả 2 app luôn hiển thị cùng trạng thái.

> RevenueCat KHÔNG lưu trạng thái premium. Nó chỉ xác nhận "đã thanh toán";
> dữ liệu cuối cùng luôn nằm ở `account_types`.

---

## 4. Voucher (mã giảm giá)

| Bảng | Mô tả |
| :-- | :-- |
| `vouchers` | Định nghĩa mã: `code`, `name` (tự đặt), `value` (**float**), `is_percent`, `max_uses`, `used_count`, `valid_from`, `valid_until`, `owner_user_id` (seeder/affiliate), `status` |
| `user_vouchers` | User đã dùng mã nào: `user_id`, `voucher_id`, `payment_id`, `status` (`unused`/`used`) |

`payments` thêm 2 field: `voucher_id` + `discount_vnd` (số tiền đã giảm).
Giá trị giảm:
- `is_percent = false` → giảm `value` (VND).
- `is_percent = true` → giảm `value%` (làm tròn).

---

## 5. Permissions (role `user`)

- `account_plans` : read
- `vouchers`      : read
- `user_vouchers` : create
- `payments`      : create + read (validation `user_id = $CURRENT_USER`)
- `account_types` : read (qua flow)

---

## 6. Cập nhật schema

Chạy (1 lần, sau khi có credential admin):

```bash
$env:DIRECTUS_ADMIN_EMAIL="admin@marutek.space"
$env:DIRECTUS_ADMIN_PASSWORD="***"
node scripts/setup-premium-schema.js   # plans free/yearly 599k/lifetime 999k + vouchers + payments/account_types fields
```
