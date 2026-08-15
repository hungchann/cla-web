/**
 * scripts/fix-lesson-content-sort.js
 *
 * Sửa lỗi "no such column: sort" khi tạo nội dung con (lesson_video /
 * lesson_theory / lesson_extra) inline trong course_lessons:
 *
 *   1. Thêm field `sort` (integer, default 1) nếu chưa có.
 *   2. Backfill sort=1 cho các dòng hiện có đang NULL.
 *   3. Hiện 3 collection (meta.hidden=false) để route tạo content hoạt động.
 *   4. Đảm bảo relation lesson_id có sort_field="sort" + sort_field_enabled.
 *
 * Run:
 *   $env:DIRECTUS_ADMIN_EMAIL="admin@education.com"
 *   $env:DIRECTUS_ADMIN_PASSWORD="***"
 *   node scripts/fix-lesson-content-sort.js
 */

const https = require("node:https");
const readline = require("node:readline");
const { URL } = require("node:url");

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";

const COLLECTIONS = [
  { collection: "lesson_video", one_field: "lesson_video" },
  { collection: "lesson_theory", one_field: "lesson_theory" },
  { collection: "lesson_extra", one_field: "lesson_extra" },
];

const SORT_FIELD = {
  field: "sort",
  type: "integer",
  schema: { name: "sort", data_type: "integer", is_nullable: true, default_value: 1 },
  meta: { interface: "input", sort: 80, width: "half", note: "Thứ tự sắp xếp (relation o2m dùng)" },
};

function log(icon, msg) {
  console.log(`${icon} ${msg}`);
}

function errorToText(e) {
  try {
    const errors = e?.data?.errors;
    if (Array.isArray(errors) && errors.length > 0) {
      return `${e?.status || ""}: ${errors.map((err) => err?.message || err?.extensions?.code || JSON.stringify(err)).join(" | ")}`;
    }
    if (e?.data) return `${e.status}: ${JSON.stringify(e.data)}`;
    return `${e?.status || ""} ${e?.message || ""}`.trim();
  } catch {
    return String(e);
  }
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
  if (email && password) return { email, password };
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((resolve) => rl.question(q, resolve));
  log("?", "DIRECTUS_ADMIN_EMAIL / DIRECTUS_ADMIN_PASSWORD (hoặc DIRECTUS_TOKEN) chưa set.");
  const e = await ask("  Admin email: ");
  const p = await ask("  Admin password: ");
  rl.close();
  return { email: e.trim(), password: p };
}

async function login(creds) {
  if (creds.token) return creds.token;
  const res = await request("POST", "/auth/login", { email: creds.email, password: creds.password });
  return res.data?.data?.access_token;
}

async function listFields(collection, token) {
  try {
    const res = await request("GET", `/fields/${collection}`, null, token);
    return res.data?.data || [];
  } catch {
    return [];
  }
}

async function main() {
  console.log("");
  log("→", `Directus target: ${API_BASE}`);
  console.log("");

  const creds = await promptCredentials();
  const token = await login(creds);
  log("✓", "Logged in.");
  console.log("");

  for (const { collection, one_field } of COLLECTIONS) {
    log(`== ${collection} ==`);

    // 1. Thêm field sort nếu thiếu
    const existing = new Set((await listFields(collection, token)).map((f) => f.field));
    if (existing.has("sort")) {
      log("  –", "sort đã tồn tại");
    } else {
      try {
        await request("POST", `/fields/${collection}`, SORT_FIELD, token);
        log("  ✓", "ĐÃ THÊM field sort");
      } catch (e) {
        log("  ✗", `Thêm sort lỗi: ${errorToText(e)}`);
      }
    }

    // 2. Backfill sort=1 cho dòng NULL
    try {
      const res = await request("GET", `/items/${collection}?limit=-1&fields=id,sort`, null, token);
      const rows = res.data?.data || [];
      let fixed = 0;
      for (const row of rows) {
        if (row.sort === null || row.sort === undefined) {
          await request("PATCH", `/items/${collection}/${row.id}`, { sort: 1 }, token);
          fixed++;
        }
      }
      log("  ✓", `Backfill sort=1 cho ${fixed} dòng NULL`);
    } catch (e) {
      log("  –", `Backfill: ${errorToText(e)}`);
    }

    // 3. Hiện collection để route tạo content hoạt động
    try {
      await request("PATCH", `/collections/${collection}`, { meta: { hidden: false } }, token);
      log("  ✓", `Hiện collection (hidden=false)`);
    } catch (e) {
      log("  –", `Hiện collection: ${errorToText(e)}`);
    }

    // 4. Relation đúng sort_field
    try {
      await request("PATCH", `/relations/${collection}/lesson_id`, { meta: { one_field, sort_field: "sort", sort_field_enabled: true } }, token);
      log("  ✓", `Relation sort_field=sort enabled`);
    } catch (e) {
      log("  –", `Relation: ${errorToText(e)}`);
    }
    console.log("");
  }

  log("✓", "Done. Thử lại: mở course_lessons → lesson (vd #48) → lesson_theory → '+'.");
  console.log("");
}

main().catch((e) => {
  console.error("Unhandled error:", errorToText(e));
  process.exit(1);
});
