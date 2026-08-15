/**
 * scripts/verify-course-content.js
 *
 * Kiểm tra nhanh xem từng course_lesson đã có đủ nội dung theo model MỚI chưa
 * (chạy sau migrate-course-content.js + cleanup-course-legacy.js).
 *
 *   - video_vocab / video_grammar : cần lesson.video_file (video mp4)
 *   - quiz_vocab / quiz_grammar   : cần ≥1 lesson_questions
 *   - conversation                : cần ≥1 lesson_dialogues
 *   - dictation                   : cần ≥1 lesson_dictation (hiện answer_text)
 *   - vocab_theory                : cần vocab_display_map_id (card là tùy chọn)
 *   - extra                       : cần ít nhất 1 trong extra_pdf/answer/audio
 *
 * Read-only. Run:
 *   node scripts/verify-course-content.js
 */

const https = require("node:https");
const readline = require("node:readline");
const { URL } = require("node:url");

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";

function log(icon, msg) {
  console.log(`${icon} ${msg}`);
}

function errorToText(e) {
  try {
    const errors = e?.data?.errors;
    if (Array.isArray(errors) && errors.length > 0) {
      return `${e?.status || ""}: ${errors.map((err) => err?.message || JSON.stringify(err)).join(" | ")}`;
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

async function fetchAll(collection, fields, token) {
  try {
    const res = await request("GET", `/items/${collection}?limit=-1&fields=${fields}`, null, token);
    return res.data?.data || [];
  } catch (e) {
    log("  ⚠", `Không đọc được ${collection}: ${errorToText(e)}`);
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

  const lessons = await fetchAll("course_lessons", "id,title,lesson_type,status,chapter_id", token);
  const videos = await fetchAll("lesson_video", "id,lesson_id,video_file,video_file.filename_disk", token);
  const theories = await fetchAll("lesson_theory", "id,lesson_id,vocab_display_map_id", token);
  const extras = await fetchAll("lesson_extra", "id,lesson_id,extra_pdf_id,extra_answer_id,extra_audio_id", token);
  const questions = await fetchAll("lesson_questions", "id,lesson_id", token);
  const dialogues = await fetchAll("lesson_dialogues", "id,lesson_id", token);
  const dictations = await fetchAll("lesson_dictation", "id,lesson_id,answer_text", token);

  const countBy = (rows, key) => {
    const map = new Map();
    for (const r of rows) {
      const k = String(r[key] ?? "");
      if (k) map.set(k, (map.get(k) || 0) + 1);
    }
    return map;
  };
  const questionCounts = countBy(questions, "lesson_id");
  const dialogueCounts = countBy(dialogues, "lesson_id");
  const dictationRows = dictations.filter((d) => d.lesson_id != null);
  const dictationCounts = countBy(dictationRows, "lesson_id");

  const byLessonId = (rows) => {
    const map = new Map();
    for (const r of rows) map.set(String(r.lesson_id), r);
    return map;
  };
  const videoRows = byLessonId(videos);
  const theoryRows = byLessonId(theories);
  const extraRows = byLessonId(extras);

  let ok = 0;
  let warn = 0;

  for (const l of lessons) {
    const id = String(l.id);
    let status = "✓";
    let note = "";

    if (["video_vocab", "video_grammar"].includes(l.lesson_type)) {
      const row = videoRows.get(id);
      if (row?.video_file) note = `video_file=${row.video_file.filename_disk || row.video_file}`;
      else { status = "✗"; note = "THIẾU lesson_video.video_file"; }
    } else if (["quiz_vocab", "quiz_grammar"].includes(l.lesson_type)) {
      const n = questionCounts.get(id) || 0;
      note = `${n} lesson_questions`;
      if (n === 0) { status = "✗"; note += " — THIẾU câu hỏi"; }
    } else if (l.lesson_type === "conversation") {
      const n = dialogueCounts.get(id) || 0;
      note = `${n} lesson_dialogues`;
      if (n === 0) { status = "✗"; note += " — THIẾU hội thoại"; }
    } else if (l.lesson_type === "dictation") {
      const rows = dictationRows.filter((d) => String(d.lesson_id) === id);
      note = `${rows.length} lesson_dictation` + (rows[0] ? ` | đáp án: "${rows[0].answer_text}"` : "");
      if (rows.length === 0) { status = "✗"; note += " — THIẾU bài chính tả"; }
    } else if (l.lesson_type === "vocab_theory") {
      const row = theoryRows.get(id);
      if (row?.vocab_display_map_id) note = `vocab_display_map_id=${row.vocab_display_map_id}`;
      else { status = "✗"; note = "THIẾU lesson_theory.vocab_display_map_id"; }
    } else if (l.lesson_type === "extra") {
      const row = extraRows.get(id);
      const has = row && (row.extra_pdf_id || row.extra_answer_id || row.extra_audio_id);
      note = has ? "có file tải" : "chưa có file";
      if (!has) { status = "⚠"; }
    }

    if (status === "✓") ok++;
    else warn++;
    log(status === "✓" ? "✓" : status === "⚠" ? "⚠" : "✗", `lesson #${id} [${l.lesson_type}] ${l.title || ""} → ${note}`);
  }

  console.log("");
  log("·", `OK: ${ok}, Cần chú ý: ${warn}.`);
  console.log("");
}

main().catch((e) => {
  console.error("Unhandled error:", errorToText(e));
  process.exit(1);
});
