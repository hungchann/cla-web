/**
 * scripts/setup-premium-schema.js
 *
 * Idempotently set up the Premium / free + affiliate (upgrade link) schema on
 * Directus via the REST admin API.
 *
 * What it does:
 *   1. Logs in as admin (env DIRECTUS_ADMIN_EMAIL / DIRECTUS_ADMIN_PASSWORD).
 *   2. Creates `account_plans` (pricing + is_premium + upgrade_url) if missing.
 *   3. Creates `payments` (VietQR pending records, promo_link_id attribution).
 *   4. Adds `upgrade_url` + `premium_promo_label` to content collections
 *      (Sections, video_section, book_library, course) so each content item
 *      can carry its own affiliate/upgrade link.
 *   5. Adds `status` / `source` to `account_types`.
 *   6. Seeds default plans if `account_plans` is empty.
 *
 * Run:
 *   $env:DIRECTUS_ADMIN_EMAIL="admin@marutek.space"
 *   $env:DIRECTUS_ADMIN_PASSWORD="***"
 *   node scripts/setup-premium-schema.js
 */

const https = require("https");
const { URL } = require("url");
const readline = require("readline");

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";

// Content collections that can carry a per-item upgrade (affiliate) link.
const CONTENT_COLLECTIONS = ["Sections", "video_section", "book_library", "course"];

const CONTENT_UPGRADE_FIELDS = [
  {
    field: "upgrade_url",
    type: "string",
    schema: { name: "upgrade_url", data_type: "varchar", max_length: 500, is_nullable: true },
    meta: { interface: "input", options: null, display: "raw", readonly: false, hidden: false, sort: 90, width: "half", note: "Affiliate/checkout link (vd /pricing?plan=yearly&ref=...) — hiển thị khi user Free muốn mở khóa nội dung này." },
  },
  {
    field: "premium_promo_label",
    type: "string",
    schema: { name: "premium_promo_label", data_type: "varchar", max_length: 255, is_nullable: true },
    meta: { interface: "input", options: null, display: "raw", readonly: false, hidden: false, sort: 91, width: "half", note: "Label nút mở khóa (vd 'Mở khóa Premium')." },
  },
];

const ACCOUNT_TYPES_EXTRA_FIELDS = [
  {
    field: "status",
    type: "string",
    schema: { name: "status", data_type: "varchar", max_length: 50, is_nullable: false, default_value: "active" },
    meta: { interface: "select-dropdown", options: { choices: [
      { text: "Active", value: "active" },
      { text: "Cancelled", value: "cancelled" },
      { text: "Expired", value: "expired" },
    ] }, display: "labels", readonly: false, hidden: false, sort: 4, width: "half", note: "Trạng thái gói cước" },
  },
  {
    field: "source",
    type: "string",
    schema: { name: "source", data_type: "varchar", max_length: 50, is_nullable: true },
    meta: { interface: "select-dropdown", options: { choices: [
      { text: "VietQR", value: "vietqr" },
      { text: "Manual", value: "manual" },
      { text: "RevenueCat", value: "revenuecat" },
    ] }, display: "labels", readonly: false, hidden: false, sort: 5, width: "half", note: "Kênh thanh toán" },
  },
];

const ACCOUNT_PLANS_COLLECTION = {
  collection: "account_plans",
  schema: { name: "account_plans" },
  meta: {
    hidden: false,
    singleton: false,
    icon: "paid",
    note: "Gói cước / định nghĩa premium + upgrade link",
  },
  fields: [
    { field: "id", type: "integer", schema: { is_primary_key: true, has_auto_increment: true }, meta: { hidden: true, interface: "input", readonly: true } },
    { field: "key", type: "string", schema: { data_type: "varchar", max_length: 50, is_nullable: false }, meta: { interface: "input", sort: 1, note: "free | monthly | yearly | lifetime" } },
    { field: "name", type: "string", schema: { data_type: "varchar", max_length: 255, is_nullable: false }, meta: { interface: "input", sort: 2, note: "Tên gói (vd Premium Năm)" } },
    { field: "name_trans", type: "string", schema: { data_type: "varchar", max_length: 255, is_nullable: true }, meta: { interface: "input", sort: 3, note: "Tên tiếng Anh/en" } },
    { field: "description", type: "text", schema: { data_type: "text", is_nullable: true }, meta: { interface: "input-multiline", sort: 4 } },
    { field: "price_vnd", type: "integer", schema: { data_type: "integer", is_nullable: true }, meta: { interface: "input", sort: 5, note: "Giá bán (VND)" } },
    { field: "original_price_vnd", type: "integer", schema: { data_type: "integer", is_nullable: true }, meta: { interface: "input", sort: 6, note: "Giá gốc (VND)" } },
    { field: "duration_days", type: "integer", schema: { data_type: "integer", is_nullable: true }, meta: { interface: "input", sort: 7, note: "Số ngày hiệu lực (0 = lifetime)" } },
    { field: "is_premium", type: "boolean", schema: { data_type: "boolean", is_nullable: false, default_value: true }, meta: { interface: "boolean", sort: 8, note: "Người dùng gói này là Premium" } },
    { field: "is_featured", type: "boolean", schema: { data_type: "boolean", is_nullable: false, default_value: false }, meta: { interface: "boolean", sort: 9, note: "Nổi bật (hiển thị 'Phổ biến nhất')" } },
    { field: "features", type: "text", schema: { data_type: "text", is_nullable: true }, meta: { interface: "input-multiline", sort: 10, note: "Mỗi ưu đãi 1 dòng" } },
    { field: "upgrade_url", type: "string", schema: { data_type: "varchar", max_length: 500, is_nullable: true }, meta: { interface: "input", sort: 11, note: "Affiliate/checkout link mặc định" } },
    { field: "sort", type: "integer", schema: { data_type: "integer", is_nullable: true }, meta: { interface: "input", sort: 12 } },
    { field: "status", type: "string", schema: { data_type: "varchar", max_length: 50, is_nullable: false, default_value: "published" }, meta: { interface: "select-dropdown", options: { choices: [
      { text: "Published", value: "published" },
      { text: "Draft", value: "draft" },
      { text: "Archived", value: "archived" },
    ] }, sort: 13, note: "Chỉ gói Published mới hiển thị" } },
  ],
};

const PAYMENTS_COLLECTION = {
  collection: "payments",
  schema: { name: "payments" },
  meta: {
    hidden: false,
    singleton: false,
    icon: "credit_card",
    note: "Giao dịch thanh toán (VietQR manual) — chờ admin xác nhận",
  },
  fields: [
    { field: "id", type: "integer", schema: { is_primary_key: true, has_auto_increment: true }, meta: { hidden: true, interface: "input", readonly: true } },
    { field: "user_id", type: "uuid", schema: { data_type: "char", max_length: 36, is_nullable: true, foreign_key_table: "directus_users", foreign_key_column: "id" }, meta: { interface: "select-dropdown-m2o", options: { template: "{{email}}" }, display: "related-values", display_options: { template: "{{email}}" }, sort: 1, note: "Người mua / đăng ký" } },
    { field: "plan_id", type: "integer", schema: { data_type: "integer", is_nullable: true, foreign_key_table: "account_plans", foreign_key_column: "id" }, meta: { interface: "select-dropdown-m2o", options: { template: "{{name}}" }, display: "related-values", display_options: { template: "{{name}}" }, sort: 2, note: "Gói đăng ký" } },
    { field: "amount_vnd", type: "integer", schema: { data_type: "integer", is_nullable: true }, meta: { interface: "input", sort: 3, note: "Số tiền (VND)" } },
    { field: "status", type: "string", schema: { data_type: "varchar", max_length: 50, is_nullable: false, default_value: "pending" }, meta: { interface: "select-dropdown", options: { choices: [
      { text: "Pending", value: "pending" },
      { text: "Paid", value: "paid" },
      { text: "Verified", value: "verified" },
      { text: "Cancelled", value: "cancelled" },
    ] }, display: "labels", display_options: { choices: [
      { text: "Pending", value: "pending", foreground: "#FFFFFF", background: "#F5B041" },
      { text: "Paid", value: "paid", foreground: "#FFFFFF", background: "#5DADE2" },
      { text: "Verified", value: "verified", foreground: "#FFFFFF", background: "#2ECC71" },
      { text: "Cancelled", value: "cancelled", foreground: "#FFFFFF", background: "#E74C3C" },
    ] }, sort: 4, note: "Pending → Verified (kích hoạt premium)" } },
    { field: "transfer_content", type: "string", schema: { data_type: "varchar", max_length: 500, is_nullable: true }, meta: { interface: "input", sort: 5, note: "Nội dung chuyển khoản (email)" } },
    { field: "promo_link_id", type: "string", schema: { data_type: "varchar", max_length: 255, is_nullable: true }, meta: { interface: "input", sort: 6, note: "Attribution nội dung (promo)" } },
    { field: "referrer_user_id", type: "uuid", schema: { data_type: "char", max_length: 36, is_nullable: true, foreign_key_table: "directus_users", foreign_key_column: "id" }, meta: { interface: "select-dropdown-m2o", options: { template: "{{email}}" }, display: "related-values", display_options: { template: "{{email}}" }, sort: 6.5, note: "Người cho link affiliate (referrer)" } },
    { field: "verified_by", type: "uuid", schema: { data_type: "char", max_length: 36, is_nullable: true, foreign_key_table: "directus_users", foreign_key_column: "id" }, meta: { interface: "select-dropdown-m2o", options: { template: "{{first_name}} {{last_name}}" }, display: "user", sort: 7, note: "Admin xác nhận" } },
    { field: "verified_at", type: "dateTime", schema: { data_type: "timestamp", is_nullable: true }, meta: { interface: "datetime", sort: 8, note: "Thời điểm xác nhận" } },
    { field: "date_created", type: "dateTime", schema: { data_type: "timestamp", is_nullable: true }, meta: { interface: "datetime", display: "datetime", readonly: true, hidden: true, sort: 99, special: ["date-created"] } },
  ],
};

const AFFILIATES_COLLECTION = {
  collection: "affiliates",
  schema: { name: "affiliates" },
  meta: {
    hidden: false,
    singleton: false,
    icon: "share_2",
    note: "Tổng hợp affiliate theo người giới thiệu (refresh bằng scripts/affiliate-report.js)",
  },
  fields: [
    { field: "id", type: "integer", schema: { is_primary_key: true, has_auto_increment: true }, meta: { hidden: true, interface: "input", readonly: true } },
    { field: "user_id", type: "uuid", schema: { data_type: "char", max_length: 36, is_nullable: true, is_unique: true, foreign_key_table: "directus_users", foreign_key_column: "id" }, meta: { interface: "select-dropdown-m2o", options: { template: "{{email}}" }, display: "related-values", display_options: { template: "{{email}}" }, sort: 1, note: "Người giới thiệu (referrer)" } },
    { field: "affiliate_url", type: "string", schema: { data_type: "varchar", max_length: 500, is_nullable: true }, meta: { interface: "input", sort: 2, readonly: true, note: "Link giới thiệu: {origin}/pricing?ref=<user_id>" } },
    { field: "referral_count", type: "integer", schema: { data_type: "integer", is_nullable: false, default_value: 0 }, meta: { interface: "input", sort: 3, note: "Tổng lượt giới thiệu (payments có referrer_user_id)" } },
    { field: "verified_count", type: "integer", schema: { data_type: "integer", is_nullable: false, default_value: 0 }, meta: { interface: "input", sort: 4, note: "Số lượt đã mua & xác nhận (status=verified)" } },
    { field: "pending_count", type: "integer", schema: { data_type: "integer", is_nullable: false, default_value: 0 }, meta: { interface: "input", sort: 5, note: "Số lượt chờ xác nhận (status=pending)" } },
    { field: "earnings_vnd", type: "integer", schema: { data_type: "integer", is_nullable: false, default_value: 0 }, meta: { interface: "input", sort: 6, note: "Tổng tiền đơn verified (VND)" } },
    { field: "date_updated", type: "dateTime", schema: { data_type: "timestamp", is_nullable: true }, meta: { interface: "datetime", display: "datetime", readonly: true, hidden: true, sort: 99, special: ["date-updated"] } },
  ],
};

// Default seed data (skip if collection already has rows).
// Chỉ 3 gói: free / yearly (599k) / lifetime (999k). Không còn gói monthly.
const DEFAULT_PLANS = [
  { key: "free", name: "Miễn phí", name_trans: "Free", price_vnd: 0, original_price_vnd: 0, duration_days: 0, is_premium: false, is_featured: false, status: "published", sort: 1, features: "Truy cập nội dung cơ bản\n2 bài tập miễn phí\n1 sổ tay từ vựng" },
  { key: "yearly", name: "Premium Năm", name_trans: "Yearly", price_vnd: 599000, original_price_vnd: 1188000, duration_days: 365, is_premium: true, is_featured: true, status: "published", sort: 2, features: "Tất cả quyền lợi Premium\nVideo & bài học không giới hạn\nĐọc toàn bộ sách song ngữ\nAI luyện nói không giới hạn\nSổ tay từ vựng không giới hạn" },
  { key: "lifetime", name: "Premium Trọn đời", name_trans: "Lifetime", price_vnd: 999000, original_price_vnd: 1990000, duration_days: 0, is_premium: true, is_featured: false, status: "published", sort: 3, features: "Tất cả quyền lợi Premium\nThanh toán một lần, dùng mãi mãi\nƯu tiên tính năng mới" },
];

// Gói cũ cần đổi giá / xoá. `monthly` sẽ bị archive; `yearly` được update giá 599k.
const PLAN_SYNC = [
  { key: "free", patch: { price_vnd: 0, name: "Miễn phí", is_premium: false, is_featured: false, status: "published", sort: 1 } },
  { key: "yearly", patch: { price_vnd: 599000, name: "Premium Năm", is_featured: true, status: "published", sort: 2 } },
  { key: "lifetime", patch: { price_vnd: 999000, name: "Premium Trọn đời", is_featured: false, status: "published", sort: 3 } },
  { key: "monthly", patch: { status: "archived", is_featured: false } },
];

const VOUCHERS_COLLECTION = {
  collection: "vouchers",
  schema: { name: "vouchers" },
  meta: {
    hidden: false,
    singleton: false,
    icon: "confirmation_number",
    note: "Mã giảm giá — mỗi seeder/affiliate có 1 voucher tự đặt tên, giá trị float custom",
  },
  fields: [
    { field: "id", type: "integer", schema: { is_primary_key: true, has_auto_increment: true }, meta: { hidden: true, interface: "input", readonly: true } },
    { field: "code", type: "string", schema: { data_type: "varchar", max_length: 50, is_nullable: false, is_unique: true }, meta: { interface: "input", sort: 1, note: "Mã giảm giá (user nhập tại /pricing), vd SUNYEARLY" } },
    { field: "name", type: "string", schema: { data_type: "varchar", max_length: 255, is_nullable: true }, meta: { interface: "input", sort: 2, note: "Tên voucher (tự đặt)" } },
    { field: "value", type: "float", schema: { data_type: "float", is_nullable: false }, meta: { interface: "input", sort: 3, note: "Giá trị giảm (float, tự custom)" } },
    { field: "is_percent", type: "boolean", schema: { data_type: "boolean", is_nullable: false, default_value: false }, meta: { interface: "boolean", sort: 4, note: "true = % giảm; false = số tiền VND" } },
    { field: "max_uses", type: "integer", schema: { data_type: "integer", is_nullable: true }, meta: { interface: "input", sort: 5, note: "Số lượt dùng tối đa (bỏ trống = không giới hạn)" } },
    { field: "used_count", type: "integer", schema: { data_type: "integer", is_nullable: false, default_value: 0 }, meta: { interface: "input", sort: 6, readonly: true, note: "Số lượt đã dùng (tự cập nhật)" } },
    { field: "valid_from", type: "dateTime", schema: { data_type: "timestamp", is_nullable: true }, meta: { interface: "datetime", sort: 7, note: "Hiệu lực từ" } },
    { field: "valid_until", type: "dateTime", schema: { data_type: "timestamp", is_nullable: true }, meta: { interface: "datetime", sort: 8, note: "Hết hạn" } },
    { field: "owner_user_id", type: "uuid", schema: { data_type: "char", max_length: 36, is_nullable: true, foreign_key_table: "directus_users", foreign_key_column: "id" }, meta: { interface: "select-dropdown-m2o", options: { template: "{{email}}" }, display: "related-values", display_options: { template: "{{email}}" }, sort: 9, note: "Chủ voucher (seeder/affiliate) — tùy chọn" } },
    { field: "sort", type: "integer", schema: { data_type: "integer", is_nullable: true }, meta: { interface: "input", sort: 10 } },
    { field: "status", type: "string", schema: { data_type: "varchar", max_length: 50, is_nullable: false, default_value: "published" }, meta: { interface: "select-dropdown", options: { choices: [
      { text: "Published", value: "published" },
      { text: "Draft", value: "draft" },
      { text: "Archived", value: "archived" },
    ] }, sort: 11, note: "Chỉ Published mới dùng được" } },
  ],
};

const USER_VOUCHERS_COLLECTION = {
  collection: "user_vouchers",
  schema: { name: "user_vouchers" },
  meta: {
    hidden: false,
    singleton: false,
    icon: "sell",
    note: "Voucher đã được sử dụng / đã dùng bởi user",
  },
  fields: [
    { field: "id", type: "integer", schema: { is_primary_key: true, has_auto_increment: true }, meta: { hidden: true, interface: "input", readonly: true } },
    { field: "user_id", type: "uuid", schema: { data_type: "char", max_length: 36, is_nullable: false, foreign_key_table: "directus_users", foreign_key_column: "id" }, meta: { interface: "select-dropdown-m2o", options: { template: "{{email}}" }, display: "related-values", display_options: { template: "{{email}}" }, sort: 1, note: "Người dùng" } },
    { field: "voucher_id", type: "integer", schema: { data_type: "integer", is_nullable: false, foreign_key_table: "vouchers", foreign_key_column: "id" }, meta: { interface: "select-dropdown-m2o", options: { template: "{{name}} ({{code}})" }, display: "related-values", display_options: { template: "{{name}} ({{code}})" }, sort: 2, note: "Voucher" } },
    { field: "payment_id", type: "integer", schema: { data_type: "integer", is_nullable: true, foreign_key_table: "payments", foreign_key_column: "id" }, meta: { interface: "select-dropdown-m2o", options: { template: "Payment #{{id}}" }, display: "related-values", display_options: { template: "Payment #{{id}}" }, sort: 3, note: "Đơn thanh toán dùng voucher" } },
    { field: "status", type: "string", schema: { data_type: "varchar", max_length: 50, is_nullable: false, default_value: "unused" }, meta: { interface: "select-dropdown", options: { choices: [
      { text: "Unused", value: "unused" },
      { text: "Used", value: "used" },
    ] }, sort: 4, note: "Trạng thái" } },
    { field: "date_created", type: "dateTime", schema: { data_type: "timestamp", is_nullable: true }, meta: { interface: "datetime", display: "datetime", readonly: true, hidden: true, sort: 99, special: ["date-created"] } },
  ],
};

// Field bổ sung cho payments (voucher giảm giá).
const PAYMENTS_EXTRA_FIELDS = [
  { field: "voucher_id", type: "integer", schema: { data_type: "integer", is_nullable: true, foreign_key_table: "vouchers", foreign_key_column: "id" }, meta: { interface: "select-dropdown-m2o", options: { template: "{{name}} ({{code}})" }, display: "related-values", display_options: { template: "{{name}} ({{code}})" }, sort: 3.5, note: "Voucher áp dụng" } },
  { field: "discount_vnd", type: "integer", schema: { data_type: "integer", is_nullable: true, default_value: 0 }, meta: { interface: "input", sort: 3.6, note: "Số tiền giảm (VND)" } },
];

// Field bổ sung cho account_types (thống nhất web + mobile qua RevenueCat).
const ACCOUNT_TYPES_SYNC_FIELDS = [
  { field: "plan_id", type: "integer", schema: { data_type: "integer", is_nullable: true, foreign_key_table: "account_plans", foreign_key_column: "id" }, meta: { interface: "select-dropdown-m2o", options: { template: "{{name}}" }, display: "related-values", display_options: { template: "{{name}}" }, sort: 5.5, note: "Gói cước đã mua" } },
  { field: "provider_transaction_id", type: "string", schema: { data_type: "varchar", max_length: 255, is_nullable: true }, meta: { interface: "input", sort: 6, note: "Mã giao dịch bên provider (RevenueCat / VietQR)" } },
];

function log(icon, msg) {
  console.log(`${icon} ${msg}`);
}

/** Chuyển lỗi Directus thành text rõ ràng (lấy message trong errors[]). */
function errorToText(e) {
  try {
    const errors = e?.data?.errors;
    if (Array.isArray(errors) && errors.length > 0) {
      const msgs = errors.map((err) => err?.message || err?.extensions?.code || JSON.stringify(err));
      return `${e?.status || ""}: ${msgs.join(" | ")}`;
    }
    if (e?.data) return `${e.status}: ${JSON.stringify(e.data)}`;
    return `${e?.status || ""} ${e?.message || ""}`.trim();
  } catch {
    return String(e);
  }
}

function requestOnce(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const data = body ? JSON.stringify(body) : null;
    const headers = { "Content-Type": "application/json", Accept: "application/json" };
    if (data) headers["Content-Length"] = Buffer.byteLength(data);
    if (token) headers.Authorization = `Bearer ${token}`;

    const req = https.request(
      { hostname: url.hostname, port: url.port || 443, path: url.pathname + url.search, method, headers },
      (res) => {
        let buf = "";
        res.on("data", (chunk) => (buf += chunk));
        res.on("end", () => {
          let parsed = null;
          try {
            parsed = buf ? JSON.parse(buf) : null;
          } catch {
            parsed = buf;
          }
          if (res.statusCode >= 200 && res.statusCode < 300) resolve({ status: res.statusCode, data: parsed });
          else reject({ status: res.statusCode, data: parsed });
        });
      }
    );
    req.on("error", (err) => {
      err.__network = true;
      reject(err);
    });
    if (data) req.write(data);
    req.end();
  });
}

/** Mã lỗi mạng tạm thời nên retry (DNS/ECONNRESET/timeout). */
const RETRYABLE_CODES = new Set(["ECONNRESET", "ENOTFOUND", "ETIMEDOUT", "EAI_AGAIN", "EPIPE", "ECONNREFUSED", "EAGAIN"]);
const RETRY_MAX = 4;
const RETRY_DELAY_MS = 1500;

async function request(method, path, body, token) {
  for (let attempt = 1; attempt <= RETRY_MAX; attempt++) {
    try {
      return await requestOnce(method, path, body, token);
    } catch (e) {
      const retryable = e?.__network && RETRYABLE_CODES.has(e?.code);
      if (!retryable || attempt === RETRY_MAX) throw e;
      log("·", `Network lỗi ${e.code || e.message} (lần ${attempt}/${RETRY_MAX - 1}) — thử lại…`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }
}

async function promptCredentials() {
  // Hỗ trợ DIRECTUS_TOKEN (static token) — nhanh, không cần mật khẩu.
  if (process.env.DIRECTUS_TOKEN) {
    return { token: process.env.DIRECTUS_TOKEN };
  }

  const email = process.env.DIRECTUS_ADMIN_EMAIL;
  const password = process.env.DIRECTUS_ADMIN_PASSWORD;
  if (email && password) return { email, password };

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((resolve) => rl.question(q, resolve));
  log("?", "DIRECTUS_ADMIN_EMAIL / DIRECTUS_ADMIN_PASSWORD (hoặc DIRECTUS_TOKEN) chưa được set trong env.");
  const e = await ask("  Admin email: ");
  const p = await ask("  Admin password: ");
  rl.close();
  return { email: e.trim(), password: p };
}

async function login(email, password) {
  const res = await request("POST", "/auth/login", { email, password });
  return res.data?.data?.access_token;
}

/**
 * Kiểm tra collection tồn tại bằng cách liệt kê danh sách.
 *
 * LƯU Ý: Directus mới trả 403 "read ... or it does not exist" cho GET
 * /collections/:name khi collection chưa có — không phải 404. Nên ta kiểm tra
 * qua GET /collections (list) để tránh nhầm lẫn giữa "không tồn tại" và "thiếu
 * quyền read".
 */
async function collectionExists(collection, token) {
  try {
    const res = await request("GET", "/collections", null, token);
    const list = res.data?.data || [];
    return list.some((c) => c && c.collection === collection);
  } catch {
    // Fallback: nếu không list được, thử GET trực tiếp (coi 403 như không tồn tại).
    try {
      await request("GET", `/collections/${collection}`, null, token);
      return true;
    } catch (err) {
      if (err.status === 404 || err.status === 403) return false;
      throw err;
    }
  }
}

async function listFields(collection, token) {
  const res = await request("GET", `/fields/${collection}`, null, token);
  return res.data?.data || [];
}

async function createField(collection, field, token) {
  return request("POST", `/fields/${collection}`, field, token);
}

async function addFieldsIfMissing(collection, fields, token) {
  const existing = await listFields(collection, token);
  const existingNames = new Set(existing.map((f) => f.field));
  for (const f of fields) {
    if (existingNames.has(f.field)) {
      log("  –", `SKIP ${collection}.${f.field} (already exists)`);
      continue;
    }
    try {
      await createField(collection, f, token);
      log("  ✓", `ADD  ${collection}.${f.field}`);
    } catch (e) {
      log("  ✗", `FAIL ${collection}.${f.field}: ${errorToText(e)}`);
      if (e.status === 403) {
        log("     ", "> Thiếu quyền field:create. Thêm field thủ công trong Directus Admin (Data Model) rồi chạy lại.");
      }
    }
  }
}

/**
 * Kiểm tra collection có bảng SQL thật bằng schema snapshot (đọc trực tiếp DB).
 * Chính xác hơn GraphQL (GraphQL cache có thể chưa cập nhật collection mới).
 */
async function snapshotHasTable(name, token) {
  try {
    const res = await request("GET", "/schema/snapshot", null, token);
    const snap = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
    return snap.includes(`"table":"${name}"`);
  } catch {
    return false;
  }
}

/**
 * Tạo collection QUA API dạng TỐI GIẢN (chỉ metadata + bảng, KHÔNG kèm field).
 *
 * LƯU Ý instance này: POST /collections kèm `fields` chỉ tạo metadata, bảng SQL
 * không được tạo (GraphQL/REST 403, /fields 403). Tạo minimal thì có bảng thật.
 * Field được thêm riêng qua POST /fields (addFieldsIfMissing) — đã xác minh hoạt động.
 */
async function createCollectionViaApi(def, token) {
  const body = {
    collection: def.collection,
    schema: def.schema,
    meta: def.meta,
  };
  return request("POST", "/collections", body, token);
}

/**
 * Đảm bảo collection tồn tại như một bảng thật.
 * - Có bảng thật      → rà field còn thiếu, return true.
 * - Chỉ metadata/thiếu → tạo qua API; nếu tạo thất bại, in hướng dẫn Admin UI, return false.
 */
async function ensureCollection(def, token) {
  const name = def.collection;
  const hasTable = await snapshotHasTable(name, token);
  const metaExists = await collectionExists(name, token);

  if (hasTable) {
    log("✓", `'${name}' có bảng dữ liệu thật — rà field còn thiếu…`);
    await addFieldsIfMissing(name, def.fields, token);
    return true;
  }

  // Không có bảng thật → tạo qua API (metadata + bảng).
  if (metaExists) {
    log("·", `'${name}' chỉ có metadata (thiếu bảng) — tạo lại bảng qua API…`);
  } else {
    log("·", `Tạo collection '${name}' qua API…`);
  }
  try {
    await createCollectionViaApi(def, token);
    log("✓", `Tạo '${name}' thành công (metadata + bảng).`);
    await addFieldsIfMissing(name, def.fields, token);
    return true;
  } catch (e) {
    log("✗", `Tạo '${name}' thất bại: ${errorToText(e)}`);
    if (e.status === 403) {
      log("  ", "> Thiếu quyền collection:create. Tạo thủ công trong Directus Admin UI → Settings → Data Model,");
      log("  ", `tên '${name}', các field:`);
      for (const f of def.fields) {
        if (f.field === "id") continue;
        log("   -", `${f.field}  (${f.type}${f.schema?.foreign_key_table ? ` → FK ${f.schema.foreign_key_table}` : ""})`);
      }
    }
    return false;
  }
}

/**
 * Tạo policy + permission rows + link policy vào role 'user'.
 *
 * LƯU Ý: Một số Directus instance cache permission và không áp dụng ngay các
 * thay đổi qua API. Nếu sau khi chạy xong mà web vẫn không đọc được account_plans,
 * hãy cấp quyền thủ công trong Directus Admin → Settings → Access Policies.
 */
async function grantItemPermissions(token) {
  const USER_ROLE_NAME = "user";

  // Tìm role 'user'
  let roleId = null;
  try {
    const res = await request("GET", `/roles?filter[name][_eq]=${encodeURIComponent(USER_ROLE_NAME)}&limit=1`, null, token);
    roleId = res.data?.data?.[0]?.id || null;
  } catch (e) {
    log("  ✗", `Find role 'user' failed: ${errorToText(e)}`);
  }
  if (!roleId) {
    log("  –", "Không tìm thấy role 'user' — bỏ qua bước cấp quyền tự động.");
    return;
  }

  const grants = [
    { collection: "account_plans", action: "read" },
    { collection: "vouchers", action: "read" },
    { collection: "user_vouchers", action: "create" },
    { collection: "payments", action: "create" },
    { collection: "payments", action: "read", validation: { user_id: { _eq: "$CURRENT_USER" } } },
  ];

  for (const g of grants) {
    const policyName = `Allow ${USER_ROLE_NAME} ${g.action} ${g.collection} (auto)`;

    // 1) Tạo policy nếu chưa tồn tại
    let policyId = null;
    try {
      const found = await request("GET", `/policies?filter[name][_eq]=${encodeURIComponent(policyName)}&limit=1`, null, token);
      policyId = found.data?.data?.[0]?.id || null;
    } catch { /* ignore */ }

    if (!policyId) {
      try {
        const created = await request("POST", "/policies", { name: policyName, app_access: false, admin_access: false }, token);
        policyId = created.data?.data?.id || null;
        log("  ✓", `Policy '${policyName}'`);
      } catch (e) {
        log("  ✗", `Create policy '${policyName}' failed: ${errorToText(e)}`);
        continue;
      }
    }

    // 2) Permission row
    try {
      const foundPerm = await request("GET", `/permissions?filter[collection][_eq]=${g.collection}&filter[action][_eq]=${g.action}&filter[policy][_eq]=${policyId}&limit=1`, null, token);
      if (foundPerm.data?.data?.length > 0) {
        log("  –", `Permission already exists: ${g.action} ${g.collection}`);
      } else {
        const body = { collection: g.collection, action: g.action, policy: policyId, fields: ["*"] };
        if (g.validation) body.validation = g.validation;
        await request("POST", "/permissions", body, token);
        log("  ✓", `Permission ${g.action} ${g.collection}`);
      }
    } catch (e) {
      log("  ✗", `Create permission ${g.action} ${g.collection} failed: ${errorToText(e)}`);
      continue;
    }

    // 3) Link policy -> role 'user'
    try {
      const foundAcc = await request("GET", `/access?filter[role][_eq]=${roleId}&filter[policy][_eq]=${policyId}&limit=1`, null, token);
      if (foundAcc.data?.data?.length > 0) {
        log("  –", `Access already linked: role 'user' -> policy '${policyName}'`);
      } else {
        await request("POST", "/access", { role: roleId, policy: policyId }, token);
        log("  ✓", `Linked role 'user' -> '${policyName}'`);
      }
    } catch (e) {
      log("  ✗", `Link role 'user' failed: ${errorToText(e)}`);
    }
  }
}

async function main() {
  console.log("");
  log("→", `Directus target: ${API_BASE}`);
  console.log("");

  const creds = await promptCredentials();
  let token;
  if (creds.token) {
    token = creds.token;
    log("✓", "Dùng DIRECTUS_TOKEN (static token)");
  } else {
    try {
      token = await login(creds.email, creds.password);
      log("✓", `Logged in as ${creds.email}`);
    } catch (e) {
      log("✗", `Login failed: ${errorToText(e)}`);
      process.exit(1);
    }
  }
  console.log("");

  // ── 1. account_plans ──────────────────────────────────────────────────────
  const accountPlansReady = await ensureCollection(ACCOUNT_PLANS_COLLECTION, token);
  console.log("");

  // ── 2. payments ───────────────────────────────────────────────────────────
  const paymentsReady = await ensureCollection(PAYMENTS_COLLECTION, token);
  console.log("");

  // ── 3. affiliates (summary per referrer) ───────────────────────────────────
  await ensureCollection(AFFILIATES_COLLECTION, token);
  console.log("");

  // ── 3b. vouchers + user_vouchers (giảm giá) ────────────────────────────────
  const vouchersReady = await ensureCollection(VOUCHERS_COLLECTION, token);
  await ensureCollection(USER_VOUCHERS_COLLECTION, token);
  console.log("");

  // ── 3c. payments extras (voucher_id, discount_vnd) ─────────────────────────
  if (await collectionExists("payments", token)) {
    log("·", "payments: adding voucher fields…");
    await addFieldsIfMissing("payments", PAYMENTS_EXTRA_FIELDS, token);
  }
  console.log("");

  // ── 3d. account_types: plan_id + provider_transaction_id (web+mobile sync) ─
  if (await collectionExists("account_types", token)) {
    log("·", "account_types: adding sync fields…");
    await addFieldsIfMissing("account_types", ACCOUNT_TYPES_SYNC_FIELDS, token);
  }
  console.log("");

  // ── 4. upgrade_url / premium_promo_label on content collections ───────────
  for (const collection of CONTENT_COLLECTIONS) {
    if (!(await collectionExists(collection, token))) {
      log("–", `SKIP ${collection} (not found)`);
      continue;
    }
    log("·", `Adding upgrade fields to '${collection}'…`);
    await addFieldsIfMissing(collection, CONTENT_UPGRADE_FIELDS, token);
  }
  console.log("");

  // ── 5. account_types extras ───────────────────────────────────────────────
  if (await collectionExists("account_types", token)) {
    log("·", "account_types: adding status/source…");
    await addFieldsIfMissing("account_types", ACCOUNT_TYPES_EXTRA_FIELDS, token);
  }
  console.log("");

  // ── 6. Seed / sync default plans (chỉ khi bảng thật tồn tại) ──────────────
  if (accountPlansReady) {
    try {
      const res = await request("GET", "/items/account_plans?fields=id,key,status,sort&limit=100", null, token);
      const rows = res.data?.data || [];
      if (rows.length === 0) {
        log("·", "Seeding default plans (free / yearly 599k / lifetime 999k)…");
        await request("POST", "/items/account_plans", DEFAULT_PLANS, token);
        log("✓", `Seeded ${DEFAULT_PLANS.length} default plans`);
      } else {
        log("·", "Syncing existing plans to free/yearly/lifetime…");
        const byKey = new Map(rows.map((r) => [r.key, r]));
        for (const sync of PLAN_SYNC) {
          const row = byKey.get(sync.key);
          if (row) {
            await request("PATCH", `/items/account_plans/${row.id}`, sync.patch, token);
            log("  ✓", `PATCH plan '${sync.key}' (${JSON.stringify(sync.patch)})`);
          } else if (sync.key !== "monthly") {
            // Thêm plan còn thiếu (vd yearly/lifetime chưa tồn tại)
            const def = DEFAULT_PLANS.find((p) => p.key === sync.key);
            if (def) {
              await request("POST", "/items/account_plans", def, token);
              log("  ✓", `ADD plan '${sync.key}'`);
            }
          }
        }
      }
    } catch (e) {
      log("✗", `Seed/sync check failed: ${errorToText(e)}`);
    }
  }
  console.log("");

  // ── 7. Grant item permissions to role 'user' (khi đã có bảng thật) ────────
  if (accountPlansReady || paymentsReady || vouchersReady) {
    log("·", "Granting item permissions (account_plans / vouchers read, payments create)…");
    await grantItemPermissions(token);
  } else {
    log("–", "Bỏ qua cấp quyền — collection chưa có bảng thật (tạo trong Admin UI trước).");
  }
  console.log("");

  log("✓", "Done.");
  console.log("");
  console.log("Next steps:");
  console.log("  1. Nếu collection chưa có bảng thật: tạo trong Directus Admin UI → Settings → Data Model");
  console.log("     (account_plans / payments / affiliates) theo danh sách field script in ra, rồi chạy lại script.");
  console.log("  2. Nếu web vẫn 403 khi đọc account_plans (instance cache permission): cấp quyền thủ công trong");
  console.log("     Directus Admin → Settings → Access Policies, cho policy của role 'user':");
  console.log("       - account_plans : read (fields *)");
  console.log("       - payments      : create + read (user_id = $CURRENT_USER)");
  console.log("  3. Seed dữ liệu gói cước (nếu seed bị 403): thêm thủ công trong Directus Admin → Content → account_plans,");
  console.log("     hoặc sau khi cấp quyền xong chạy lại script (nó sẽ seed nếu bảng trống).");
  console.log("  4. Khi admin xác nhận chuyển khoản: tạo/update bản ghi account_types (type=yearly, expired_time, status=active) cho user.");
  console.log("  5. Quản lý Affiliate trong Content:");
  console.log("     - Content → payments     : mỗi dòng = 1 đơn (user_id = người mua, referrer_user_id = người giới thiệu).");
  console.log("     - Content → affiliates   : tổng hợp theo referrer. Refresh bằng: node scripts/affiliate-report.js");
  console.log("  6. Frontend web đã dùng /pricing + PremiumProvider — không cần thêm cấu hình.");
  console.log("");
}

main().catch((e) => {
  console.error("Unhandled error:", errorToText(e));
  process.exit(1);
});
