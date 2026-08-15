/**
 * scripts/cleanup-junk-lessons.js
 *
 * Xóa các lesson RÁC (dữ liệu test) khỏi khóa học: lesson, dòng con trong
 * mọi collection lesson_* và chapter rỗng (nếu cần).
 *
 * Mặc định DRY-RUN. Muốn xóa: node scripts/cleanup-junk-lessons.js --apply
 *
 * Run:
 *   $env:DIRECTUS_ADMIN_EMAIL="admin@education.com"
 *   $env:DIRECTUS_ADMIN_PASSWORD="***"
 *   node scripts/cleanup-junk-lessons.js            # preview
 *   node scripts/cleanup-junk-lessons.js --apply    # xóa
 */

const https = require("node:https");
const readline = require("node:readline");
const { URL } = require("node:url");

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";
const APPLY = process.argv.includes("--apply");

// Lesson rác cần xóa (dữ liệu test, không có nội dung thật)
const JUNK_LESSON_IDS = [1, 46, 47];

const CHILD_COLLECTIONS = [
  "lesson_video",
  "lesson_theory",
  "lesson_extra",
  "lesson_vocab",
  "lesson_questions",
  "lesson_theory_cards",
  "lesson_dictation",
  "lesson_dialogues",
];

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
  log("→", `Mode: ${APPLY ? "APPLY" : "DRY-RUN"}`);
  log("→", `Lesson rác sẽ xóa: ${JUNK_LESSON_IDS.join(", ")}`);
  console.log("");

  const creds = await promptCredentials();
  const token = await login(creds);
  log("✓", "Logged in.");
  console.log("");

  for (const lessonId of JUNK_LESSON_IDS) {
    // 1. Hiển thị lesson trước khi xóa
    let lesson = null;
    try {
      const res = await request("GET", `/items/course_lessons/${lessonId}?fields=id,title,lesson_type,status,chapter_id`, null, token);
      lesson = res.data?.data;
    } catch (e) {
      log("  –", `lesson #${lessonId}: không tồn tại (${errorToText(e)})`);
      continue;
    }
    log("·", `lesson #${lessonId} [${lesson?.lesson_type}] '${lesson?.title || ""}' status=${lesson?.status} chapter=${lesson?.chapter_id}`);

    // 2. Xóa dòng con trước (tránh orphan / FK RESTRICT)
    for (const col of CHILD_COLLECTIONS) {
      let rows = [];
      try {
        const res = await request("GET", `/items/${col}?filter[lesson_id][_eq]=${lessonId}&fields=id`, null, token);
        rows = res.data?.data || [];
      } catch {
        rows = [];
      }
      for (const row of rows) {
        if (APPLY) {
          try {
            await request("DELETE", `/items/${col}/${row.id}`, null, token);
            log("  ✓", `xóa ${col} #${row.id} (lesson #${lessonId})`);
          } catch (e) {
            log("  ✗", `${col} #${row.id}: ${errorToText(e)}`);
          }
        } else {
          log("  ·", `(dry-run) sẽ xóa ${col} #${row.id} (lesson #${lessonId})`);
        }
      }
    }

    // 3. Xóa lesson
    if (APPLY) {
      try {
        await request("DELETE", `/items/course_lessons/${lessonId}`, null, token);
        log("  ✓", `ĐÃ XÓA lesson #${lessonId}`);
      } catch (e) {
        log("  ✗", `lesson #${lessonId}: ${errorToText(e)}`);
      }
    } else {
      log("  ·", `(dry-run) sẽ xóa lesson #${lessonId}`);
    }
    console.log("");
  }

  if (!APPLY) {
    log("→", "DRY-RUN — chưa xóa gì. Chạy lại với `--apply` để thực hiện.");
  } else {
    log("✓", "Hoàn tất dọn lesson rác.");
  }
  console.log("");
}

main().catch((e) => {
  console.error("Unhandled error:", errorToText(e));
  process.exit(1);
});
