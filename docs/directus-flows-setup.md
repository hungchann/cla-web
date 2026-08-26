# Setup Directus Flows — Kích hoạt Premium & Voucher tự động

> Hoàn thiện vòng lặp thanh toán: admin chỉ cần **flip `payments.status = verified`** trong
> Directus panel — Flow phía server lo phần còn lại (cập nhật `account_types`, tăng
> `vouchers.used_count`). Web không cần trang admin.

Cấu hình trong **Directus Admin → Settings → Flows** (`https://marutek.space/admin`).

---

## Flow 1: Payment verified → kích hoạt Premium

| Cấu hình | Giá trị |
| :-- | :-- |
| Name | `Payment Verified → Activate Premium` |
| Trigger | **Event — Action (Non-Blocking / Blocking đều được)** |
| Scope | `items.update` |
| Collection | `payments` |

**Filter trigger** (chỉ chạy khi status chuyển sang `verified`):

```json
{
  "event": "items.update",
  "payload": { "status": { "_eq": "verified" } },
  "key": { "_eq": "$trigger.key" }
}
```

Hoặc dùng condition của trigger: *Edit Field* = `status`, và
`$trigger.payload.status == 'verified'`.

**Step 1 — Read payment** (operation *Read Data*, collection `payments`):

```
Key: {{ $trigger.key }}
Fields: id, user_id, plan_id, amount_vnd, verified_at
```

**Step 2 — Read plan** (*Read Data*, collection `account_plans`):

```
Key: {{ step_1.plan_id }}
```

**Step 3 — Upsert `account_types`** (*Script* operation — khuyến nghị, xử lý cả create/update):

```js
module.exports = async function (data) {
  const { services, getSchema, logger } = data;
  const { ItemsService } = services;
  const schema = await getSchema();

  const planSvc = new ItemsService("account_plans", { schema });
  const typeSvc = new ItemsService("account_types", { schema });
  const paySvc = new ItemsService("payments", { schema });

  const plan = await planSvc.readOne(data.$trigger.plan_id);
  const userId = String(data.$trigger.user_id);
  const durationDays = Number(plan.duration_days ?? 0);

  const expiredTime =
    durationDays > 0
      ? new Date(Date.now() + durationDays * 86400000).toISOString()
      : null; // lifetime

  const existing = await typeSvc.readByQuery({
    filter: { user_id: { _eq: userId } },
    limit: 1,
  });

  const payload = {
    user_id: userId,
    type: plan.key, // yearly | lifetime
    status: "active",
    source: "vietqr",
    plan_id: plan.id,
    expired_time: expiredTime,
    provider_transaction_id: String(data.$trigger.payment_id),
  };

  if (existing?.length) {
    await typeSvc.updateOne(existing[0].id, payload);
  } else {
    await typeSvc.createOne(payload);
  }

  // Ghi vết thời điểm kích hoạt lên payment (optional)
  await paySvc.updateOne(data.$trigger.payment_id, {
    verified_by_note: "auto-activated by flow",
  });

  logger.info(`[flow] activated premium ${plan.key} for ${userId}`);
  return { ok: true };
};
```

> Nếu không muốn dùng Script, có thể thay bằng chuỗi *Read account_types (filter user_id)*
> → *Condition* → *Create item* / *Update item*. Script ngắn gọn và idempotent hơn.

---

## Flow 2: user_vouchers created → tăng `used_count` voucher

Thay cho việc client tự `PATCH vouchers.used_count` (đã bỏ vì vi phạm permission + race condition).

| Cấu hình | Giá trị |
| :-- | :-- |
| Name | `Voucher Used Count++` |
| Trigger | **Event — Action** |
| Scope | `items.create` |
| Collection | `user_vouchers` |

**Step — Script**:

```js
module.exports = async function (data) {
  const { services, getSchema, logger } = data;
  const { ItemsService } = services;
  const schema = await getSchema();

  const voucherId = data.$trigger.voucher_id;
  if (!voucherId) return { ok: false };

  const svc = new ItemsService("vouchers", { schema });
  const voucher = await svc.readOne(voucherId);
  if (!voucher) return { ok: false };

  // used_count tăng nguyên tử ở mức thao tác đọc→ghi trong 1 process Flow;
  // race giữa 2 đơn song song hiếm và chấp nhận được với max_uses marketing.
  await svc.updateOne(voucherId, {
    used_count: Number(voucher.used_count ?? 0) + 1,
  });
  logger.info(`[flow] voucher ${voucher.code} used_count -> ${Number(voucher.used_count ?? 0) + 1}`);
  return { ok: true };
};
```

---

## Quy trình vận hành sau khi setup xong 2 Flow

1. User checkout trên `/pricing` → web gọi `POST /api/payments` (amount tính server-side)
   → đơn `payments(status=pending)` + dòng `user_vouchers`.
2. Admin vào **Content → payments**, đối soát ngân hàng → đổi `status` thành `verified`.
3. Flow 1 tự động tạo/cập nhật `account_types` → user trở thành Premium.
4. User bấm **“Làm mới Premium”** ở card Lịch sử thanh toán trên `/pricing`
   (hoặc F5) → gate mở khoá ngay, không cần chờ cache 5 phút.

## Kiểm tra sau cấu hình

- [ ] Tạo đơn test pending → flip `verified` → `account_types` xuất hiện/cập nhật với
      `type` đúng theo `plan.key`, `source=vietqr`, `expired_time` = now + duration_days.
- [ ] Đơn `lifetime` (duration_days=0) → `expired_time` để trống.
- [ ] Flip lại sang `cancelled` KHÔNG kích hoạt (Flow chỉ lọc `verified`).
- [ ] Tạo `user_vouchers` test → `vouchers.used_count` +1.
