/**
 * scripts/grant-course-content-permissions.js
 *
 * Cấp quyền FULL (read/create/update/delete) trên toàn bộ collection khóa học
 * cho mọi role, dùng đúng chuẩn Directus v11: Policy + Permission + Access.
 * (Script grant-course-permissions.js cũ dùng API role-based legacy — không
 * hiệu quả trên instance này, gây lỗi [FORBIDDEN] khi mở collection con.)
 *
 * Áp dụng cho các collection:
 *   course, course_chapters, course_lessons,
 *   lesson_video, lesson_theory, lesson_extra,
 *   lesson_vocab, lesson_questions, lesson_theory_cards,
 *   lesson_dictation, lesson_dialogues, banners
 *
 * Run:
 *   $env:DIRECTUS_ADMIN_EMAIL="admin@education.com"
 *   $env:DIRECTUS_ADMIN_PASSWORD="***"
 *   node scripts/grant-course-content-permissions.js
 */

const https = require("node:https");
const readline = require("node:readline");
const { URL } = require("node:url");

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";

const COLLECTIONS = [
  "course",
  "course_chapters",
  "course_lessons",
  "lesson_video",
  "lesson_theory",
  "lesson_extra",
  "lesson_vocab",
  "lesson_questions",
  "lesson_theory_cards",
  "lesson_dictation",
  "lesson_dialogues",
  "banners",
];

const ACTIONS = ["read", "create", "update", "delete"];

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

async function main() {
  console.log("");
  log("→", `Directus target: ${API_BASE}`);
  console.log("");

  const creds = await promptCredentials();
  const token = await login(creds);
  log("✓", "Logged in.");
  console.log("");

  // 1. Liệt kê roles
  let roles = [];
  try {
    const res = await request("GET", "/roles", null, token);
    roles = res.data?.data || [];
  } catch (e) {
    log("✗", `Không đọc được roles: ${errorToText(e)}`);
    process.exit(1);
  }
  log("·", `Roles: ${roles.map((r) => `${r.name} (${r.id})`).join(", ")}`);
  console.log("");

  for (const role of roles) {
    log(`== Role '${role.name}' ==`);
    for (const collection of COLLECTIONS) {
      for (const action of ACTIONS) {
        const policyName = `Allow ${role.name} ${action} ${collection} (auto)`;

        // 2. Policy (tạo nếu thiếu)
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

        // 3. Permission (tạo nếu thiếu) — policy id
        try {
          const foundPerm = await request("GET", `/permissions?filter[collection][_eq]=${collection}&filter[action][_eq]=${action}&filter[policy][_eq]=${policyId}&limit=1`, null, token);
          if (foundPerm.data?.data?.length > 0) {
            // Đã có → không cần làm gì
          } else {
            await request("POST", "/permissions", { collection, action, policy: policyId, fields: ["*"] }, token);
            log("  ✓", `Permission ${action} ${collection}`);
          }
        } catch (e) {
          log("  –", `Permission ${action} ${collection}: ${errorToText(e)}`);
        }

        // 4. Access: link role → policy
        try {
          const foundAcc = await request("GET", `/access?filter[role][_eq]=${role.id}&filter[policy][_eq]=${policyId}&limit=1`, null, token);
          if (foundAcc.data?.data?.length > 0) {
            // đã link
          } else {
            await request("POST", "/access", { role: role.id, policy: policyId }, token);
            log("  ✓", `Linked role '${role.name}' -> '${policyName}'`);
          }
        } catch (e) {
          log("  –", `Link access: ${errorToText(e)}`);
        }
      }
    }
    console.log("");
  }

  log("✓", "Done. Cấp quyền FULL cho mọi collection khóa học trên mọi role.");
  log("→", "Thử lại: mở course_lessons → lesson (vd #48) → mục lesson_theory → '+' (điền inline, không cần vào collection riêng).");
  console.log("");
}

main().catch((e) => {
  console.error("Unhandled error:", errorToText(e));
  process.exit(1);
});
