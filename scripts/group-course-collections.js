/**
 * scripts/group-course-collections.js
 *
 * Gom tất cả collection của module Khóa học vào 1 folder duy nhất trên
 * sidebar Directus, bỏ nesting cha-con (meta.group), và ẩn các collection con
 * đã nhập INLINE trong course_lessons (lesson_vocab / lesson_questions /
 * lesson_theory_cards / lesson_dictation / lesson_dialogues).
 *
 * Kết quả sidebar:
 *   Course Content (folder)
 *   ├── Course            (hiện)
 *   ├── Course Chapters   (hiện)
 *   ├── Course Lessons    (hiện)
 *   └── Banners           (hiện)
 *   (lesson_vocab, lesson_questions, ... ẩn — vẫn quản lý qua o2m trong lesson)
 *
 * Dùng API folder: GET/POST /folders + PATCH /collections/:name { meta: { folder, group, hidden } }.
 * Mặc định DRY-RUN. Muốn áp dụng: node scripts/group-course-collections.js --apply
 *
 * Run:
 *   $env:DIRECTUS_ADMIN_EMAIL="admin@education.com"
 *   $env:DIRECTUS_ADMIN_PASSWORD="***"
 *   node scripts/group-course-collections.js            # preview
 *   node scripts/group-course-collections.js --apply    # thực hiện
 */

const https = require("node:https");
const readline = require("node:readline");
const { URL } = require("node:url");

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";
const APPLY = process.argv.includes("--apply");

const FOLDER_KEY = "course_content";
const FOLDER_NAME = "Course Content";

/** collection → { hidden: boolean } */
const COLLECTIONS = {
  course: { hidden: false },
  course_chapters: { hidden: false },
  course_lessons: { hidden: false },
  // 3 collection con mới GIỮ HIỆN — cần route tạo content + admin vào sửa trực tiếp
  lesson_video: { hidden: false },
  lesson_theory: { hidden: false },
  lesson_extra: { hidden: false },
  // 5 collection con cũ ẩn (nhập inline qua lesson, đã hoạt động tốt)
  lesson_vocab: { hidden: true },
  lesson_questions: { hidden: true },
  lesson_theory_cards: { hidden: true },
  lesson_dictation: { hidden: true },
  lesson_dialogues: { hidden: true },
  banners: { hidden: false },
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

async function main() {
  console.log("");
  log("→", `Directus target: ${API_BASE}`);
  log("→", `Mode: ${APPLY ? "APPLY" : "DRY-RUN"}`);
  console.log("");

  const creds = await promptCredentials();
  const token = await login(creds);
  log("✓", "Logged in.");
  console.log("");

  // 1. Probe folder support
  let folders = [];
  try {
    const res = await request("GET", "/folders", null, token);
    folders = res.data?.data || [];
    log("✓", "Directus hỗ trợ /folders.");
  } catch (e) {
    log("✗", `/folders không khả dụng: ${errorToText(e)}`);
    log("→", "Fallback: chỉ ẩn collection con (không gom folder).");
    folders = null;
  }
  console.log("");

  // 2. Tạo / tìm folder "Course Content"
  let folderId = null;
  if (folders) {
    folderId = folders.find((f) => f.name === FOLDER_NAME || f.name === FOLDER_KEY)?.id || null;
    if (!folderId) {
      if (APPLY) {
        try {
          const created = await request("POST", "/folders", { name: FOLDER_NAME, parent: null }, token);
          folderId = created.data?.data?.id || null;
          log("  ✓", `Tạo folder '${FOLDER_NAME}' (id=${folderId})`);
        } catch (e) {
          log("  ✗", `Tạo folder thất bại: ${errorToText(e)}`);
        }
      } else {
        log("  ·", `(dry-run) sẽ tạo folder '${FOLDER_NAME}'`);
      }
    } else {
      log("  –", `Folder '${FOLDER_NAME}' đã tồn tại (id=${folderId})`);
    }
    console.log("");
  }

  // 3. PATCH từng collection
  for (const [collection, cfg] of Object.entries(COLLECTIONS)) {
    let current = null;
    try {
      const res = await request("GET", `/collections/${collection}`, null, token);
      current = res.data?.data;
    } catch (e) {
      log("  –", `${collection}: không đọc được (${errorToText(e)})`);
      continue;
    }
    const meta = current?.meta || {};
    const plan = {
      hidden: cfg.hidden,
      ...(folders && folderId ? { folder: folderId } : {}),
      ...(folders ? { group: null } : {}), // bỏ nesting cha-con
    };
    const changed =
      meta.hidden !== cfg.hidden ||
      (folders && meta.folder !== folderId) ||
      (folders && meta.group != null);

    if (!changed) {
      log("  –", `${collection}: đã đúng cấu hình (hidden=${cfg.hidden})`);
      continue;
    }
    if (APPLY) {
      try {
        await request("PATCH", `/collections/${collection}`, { meta: plan }, token);
        log("  ✓", `${collection}: PATCH ${JSON.stringify(plan)}`);
      } catch (e) {
        log("  ✗", `${collection}: ${errorToText(e)}`);
      }
    } else {
      log("  ·", `${collection}: sẽ PATCH ${JSON.stringify(plan)}`);
    }
  }
  console.log("");

  if (!APPLY) {
    log("→", "DRY-RUN — chưa sửa gì. Chạy lại với `--apply` để áp dụng.");
  } else {
    log("✓", "Hoàn tất sắp xếp sidebar.");
    log("→", "Ẩn/lưu ý: lesson_vocab / lesson_questions / lesson_theory_cards / lesson_dictation / lesson_dialogues đã ẩn khỏi sidebar — vẫn nhập được qua course_lessons (o2m inline).");  }
  console.log("");
}

main().catch((e) => {
  console.error("Unhandled error:", errorToText(e));
  process.exit(1);
});
