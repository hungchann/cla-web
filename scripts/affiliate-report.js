/**
 * scripts/affiliate-report.js
 *
 * Tổng hợp dữ liệu affiliate theo người giới thiệu từ `payments` → cập nhật `affiliates`.
 *
 * Kết quả (mỗi dòng `affiliates` = 1 referrer):
 *   - referral_count   : tổng số đơn có referrer_user_id
 *   - verified_count   : số đơn status=verified (đã mua & xác nhận)
 *   - pending_count    : số đơn status=pending (chờ xác nhận)
 *   - earnings_vnd     : tổng amount_vnd của đơn verified
 *   - affiliate_url    : {origin}/pricing?ref=<user_id> (origin lấy từ env hoặc mặc định)
 *
 * Run:
 *   $env:DIRECTUS_ADMIN_EMAIL="admin@..." ; $env:DIRECTUS_ADMIN_PASSWORD="***"
 *   node scripts/affiliate-report.js
 *
 * Hoặc dùng token tĩnh có quyền đọc payments + ghi affiliates:
 *   $env:DIRECTUS_TOKEN="..."
 *   node scripts/affiliate-report.js
 */

const https = require("https");
const { URL } = require("url");
const readline = require("readline");

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";
const ORIGIN = process.env.NEXT_PUBLIC_AFFILIATE_ORIGIN || "https://cla-web.example";

function log(icon, msg) {
  console.log(`${icon} ${msg}`);
}

function request(method, path, body, token) {
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
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function promptCredentials() {
  if (process.env.DIRECTUS_TOKEN) return { token: process.env.DIRECTUS_TOKEN };
  const email = process.env.DIRECTUS_ADMIN_EMAIL;
  const password = process.env.DIRECTUS_ADMIN_PASSWORD;
  if (email && password) {
    const res = await request("POST", "/auth/login", { email, password });
    return { token: res.data?.data?.access_token };
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((resolve) => rl.question(q, resolve));
  log("?", "Cần DIRECTUS_TOKEN hoặc DIRECTUS_ADMIN_EMAIL / DIRECTUS_ADMIN_PASSWORD.");
  const e = await ask("  Admin email: ");
  const p = await ask("  Admin password: ");
  rl.close();
  const res = await request("POST", "/auth/login", { email: e.trim(), password: p });
  return { token: res.data?.data?.access_token };
}

/** Đọc toàn bộ items (paginate 100/lần). */
async function fetchAll(collection, fields, token) {
  const items = [];
  let offset = 0;
  while (true) {
    const res = await request(
      "GET",
      `/items/${collection}?fields=${fields}&limit=100&offset=${offset}`,
      null,
      token,
    );
    const batch = res.data?.data || [];
    items.push(...batch);
    if (batch.length < 100) break;
    offset += batch.length;
  }
  return items;
}

async function main() {
  console.log("");
  log("→", `Directus target: ${API_BASE}`);

  const { token } = await promptCredentials();
  if (!token) {
    log("✗", "Không lấy được token.");
    process.exit(1);
  }

  // 1) Đọc payments
  let payments;
  try {
    payments = await fetchAll(
      "payments",
      "id,user_id,referrer_user_id,status,amount_vnd",
      token,
    );
  } catch (e) {
    log("✗", `Không đọc được payments: ${JSON.stringify(e.data?.errors?.[0]?.message || e.status || e)}`);
    log("  ", "Hãy chắc chắn token có quyền read payments.");
    process.exit(1);
  }
  log("✓", `Đã đọc ${payments.length} đơn thanh toán`);

  // 2) Đọc affiliates hiện có (map user_id -> id)
  const affiliates = await fetchAll("affiliates", "id,user_id", token).catch(() => []);
  const affiliateIdByUser = new Map();
  for (const a of affiliates) {
    if (a.user_id) affiliateIdByUser.set(String(a.user_id), a.id);
  }

  // 3) Group theo referrer
  const stats = new Map(); // user_id -> { referral, verified, pending, earnings }
  for (const p of payments) {
    if (!p.referrer_user_id) continue;
    const key = String(p.referrer_user_id);
    if (!stats.has(key)) {
      stats.set(key, { referral: 0, verified: 0, pending: 0, earnings: 0 });
    }
    const s = stats.get(key);
    s.referral += 1;
    if (p.status === "verified") {
      s.verified += 1;
      s.earnings += Number(p.amount_vnd) || 0;
    } else if (p.status === "pending") {
      s.pending += 1;
    }
  }
  log("·", `${stats.size} người giới thiệu có đơn.`);

  // 4) Upsert affiliates
  let upserted = 0;
  for (const [userId, s] of stats) {
    const payload = {
      user_id: userId,
      affiliate_url: `${ORIGIN}/pricing?ref=${encodeURIComponent(userId)}`,
      referral_count: s.referral,
      verified_count: s.verified,
      pending_count: s.pending,
      earnings_vnd: s.earnings,
    };
    const existingId = affiliateIdByUser.get(userId);
    try {
      if (existingId) {
        await request("PATCH", `/items/affiliates/${existingId}`, payload, token);
      } else {
        await request("POST", "/items/affiliates", payload, token);
      }
      upserted += 1;
    } catch (e) {
      log("✗", `Upsert affiliates cho user ${userId} thất bại: ${JSON.stringify(e.data?.errors?.[0]?.message || e.status || e)}`);
    }
  }

  console.log("");
  for (const [userId, s] of stats) {
    console.log(
      `  • referrer ${userId}: ${s.referral} đơn · verified ${s.verified} · pending ${s.pending} · ${s.earnings.toLocaleString("vi-VN")}đ`,
    );
  }
  console.log("");
  log("✓", `Done. Cập nhật ${upserted}/${stats.size} dòng affiliates.`);
  console.log("");
  console.log("Xem trong Directus Admin → Content → affiliates (mỗi dòng = 1 người giới thiệu).");
  console.log("Chi tiết từng đơn: Content → payments, lọc cột referrer_user_id.");
  console.log("");
}

main().catch((e) => {
  console.error("Unhandled error:", e);
  process.exit(1);
});
