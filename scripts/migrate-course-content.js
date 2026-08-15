/**
 * scripts/migrate-course-content.js
 *
 * Copy dữ liệu cũ của course lessons sang model nội dung mới (chạy SAU
 * setup-course-content-schema.js). Idempotent — bỏ qua lesson đã migrate.
 *
 *   - video_vocab / video_grammar  : video_section_id → copy video_file/srt_file/video_cover
 *                                      trực tiếp lên lesson, rồi clear video_section_id.
 *   - quiz_vocab / quiz_grammar    : exercise_id (link_exercise) → copy exercises → lesson_questions,
 *                                      rồi clear exercise_id.
 *   - conversation                 : scenario_id → copy speaking_dialogues → lesson_dialogues,
 *                                      rồi clear scenario_id.
 *   - dictation                    : lesson.content → tạo 1 dòng lesson_dictation (answer_text),
 *                                      rồi clear content + audio_id.
 *   - vocab_theory                 : GIỮ vocab_display_map_id (card lý thuyết để admin nhập lại).
 *   - extra                        : không đổi.
 *
 * Ngoài ra: dọn các FK legacy LỆCH loại bài (vd exercise_id trên lesson conversation,
 * scenario_id trên lesson quiz) và resource_collection (M2A cũ, resource_id đã xóa)
 * → về NULL để field legacy trống, sau đó mới xóa field được.
 *
 * Script này KHÔNG xóa field — chỉ move dữ liệu + clear giá trị legacy.
 * Xóa field dùng: node scripts/cleanup-course-legacy.js --apply
 *
 * Run:
 *   $env:DIRECTUS_ADMIN_EMAIL="admin@education.com"
 *   $env:DIRECTUS_ADMIN_PASSWORD="***"
 *   node scripts/migrate-course-content.js
 */

const https = require("node:https");
const { URL } = require("node:url");
const readline = require("node:readline");

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";

const VIDEO_TYPES = ["video_vocab", "video_grammar"];
const QUIZ_TYPES = ["quiz_vocab", "quiz_grammar"];

function log(icon, msg) {
  console.log(`${icon} ${msg}`);
}

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
  log("?", "DIRECTUS_ADMIN_EMAIL / DIRECTUS_ADMIN_PASSWORD (hoặc DIRECTUS_TOKEN) chưa được set.");
  const e = await ask("  Admin email: ");
  const p = await ask("  Admin password: ");
  rl.close();
  return { email: e.trim(), password: p };
}

async function login(email, password) {
  const res = await request("POST", "/auth/login", { email, password });
  return res.data?.data?.access_token;
}

/** Đếm số dòng con của collection theo lesson_id. */
async function countChildren(collection, token) {
  const map = new Map();
  try {
    const res = await request("GET", `/items/${collection}?limit=-1&fields=lesson_id`, null, token);
    for (const row of res.data?.data || []) {
      const key = String(row.lesson_id ?? "");
      if (key) map.set(key, (map.get(key) || 0) + 1);
    }
  } catch (e) {
    log("  ⚠", `Không đếm được ${collection}: ${errorToText(e)}`);
  }
  return map;
}

async function listFields(collection, token) {
  try {
    const res = await request("GET", `/fields/${collection}`, null, token);
    return res.data?.data || [];
  } catch {
    return [];
  }
}

/** PATCH nhiều field về null trên 1 lesson (an toàn, chỉ khi field tồn tại). */
async function clearLessonFields(lessonId, fields, token) {
  const patch = {};
  for (const f of fields) patch[f] = null;
  try {
    await request("PATCH", `/items/course_lessons/${lessonId}`, patch, token);
    return true;
  } catch (e) {
    log("  ✗", `Lesson #${lessonId} clear ${fields.join(",")} failed: ${errorToText(e)}`);
    return false;
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

  // Field thực tế trên course_lessons (tránh query field đã xóa → 403)
  const existingFields = new Set((await listFields("course_lessons", token)).map((f) => f.field));
  const pick = (...fields) => fields.filter((f) => existingFields.has(f));
  const LESSON_FIELDS = [
    "id", "title", "lesson_type", "status", "chapter_id",
    ...pick("video_file", "video_section_id", "exercise_id", "scenario_id", "audio_id", "content", "resource_collection"),
  ].join(",");

  const lessonsRes = await request(
    "GET",
    `/items/course_lessons?limit=-1&fields=${LESSON_FIELDS}&sort=sort`,
    null,
    token
  );
  const lessons = lessonsRes.data?.data || [];
  log("·", `${lessons.length} lessons fetched.\n`);

  const questionCounts = await countChildren("lesson_questions", token);
  const dialogueCounts = await countChildren("lesson_dialogues", token);
  const dictationCounts = await countChildren("lesson_dictation", token);
  console.log("");

  let videoMigrated = 0;
  let quizMigrated = 0;
  let dialogueMigrated = 0;
  let dictationMigrated = 0;
  let cleared = 0;

  for (const lesson of lessons) {
    const id = lesson.id;
    const type = lesson.lesson_type;

    // ── VIDEO: video_section → video_file/srt_file trực tiếp trên lesson ────
    if (VIDEO_TYPES.includes(type) && lesson.video_section_id) {
      const vs = lesson.video_section_id;
      const vsId = typeof vs === "object" ? vs.id : vs;
      const existingVideo = typeof lesson.video_file === "object" ? lesson.video_file?.id : lesson.video_file;
      if (existingVideo) {
        log("  –", `Lesson #${id} đã có video_file — clear video_section_id`);
        if (await clearLessonFields(id, ["video_section_id"], token)) cleared++;
        continue;
      }
      try {
        const detail = await request("GET", `/items/video_section/${vsId}?fields=id,title,video_file,srt_file,image_cover`, null, token);
        const row = detail.data?.data;
        const patch = {
          video_file: row?.video_file || null,
          srt_file: row?.srt_file || null,
          video_cover: row?.image_cover || null,
        };
        await request("PATCH", `/items/course_lessons/${id}`, patch, token);
        await clearLessonFields(id, ["video_section_id"], token);
        videoMigrated++;
        cleared++;
        log("  ✓", `Lesson #${id} → video_file/srt_file/video_cover, clear video_section_id`);
      } catch (e) {
        log("  ✗", `Lesson #${id} video migrate failed: ${errorToText(e)}`);
      }
    }

    // ── QUIZ: link_exercise.exercises → lesson_questions ────────────────────
    if (QUIZ_TYPES.includes(type) && lesson.exercise_id) {
      const hasQuestions = (questionCounts.get(String(id)) || 0) > 0;
      if (hasQuestions) {
        log("  –", `Lesson #${id} đã có lesson_questions — clear exercise_id`);
        if (await clearLessonFields(id, ["exercise_id"], token)) cleared++;
        continue;
      }
      try {
        const exRes = await request(
          "GET",
          `/items/exercises?filter[link_exercise_id][_eq]=${lesson.exercise_id}&sort=sort&limit=-1&fields=id,question,answer_A,answer_B,answer_C,answer_D,Correct_answer,Explanation,sort`,
          null,
          token
        );
        const questions = exRes.data?.data || [];
        if (questions.length === 0) {
          log("  –", `Lesson #${id}: không có exercises cho link_exercise #${lesson.exercise_id} (giữ exercise_id)`);
          continue;
        }
        for (const q of questions) {
          await request("POST", "/items/lesson_questions", {
            lesson_id: id,
            question: q.question || "",
            answer_A: q.answer_A || null,
            answer_B: q.answer_B || null,
            answer_C: q.answer_C || null,
            answer_D: q.answer_D || null,
            correct_answer: q.Correct_answer || null,
            explanation: q.Explanation || null,
            sort: q.sort ?? 1,
            status: "published",
          }, token);
        }
        await clearLessonFields(id, ["exercise_id"], token);
        quizMigrated += questions.length;
        cleared++;
        log("  ✓", `Lesson #${id} → ${questions.length} lesson_questions, clear exercise_id`);
      } catch (e) {
        log("  ✗", `Lesson #${id} quiz migrate failed: ${errorToText(e)}`);
      }
    }

    // ── CONVERSATION: speaking_dialogues → lesson_dialogues ────────────────
    if (type === "conversation" && lesson.scenario_id) {
      const hasDialogues = (dialogueCounts.get(String(id)) || 0) > 0;
      if (hasDialogues) {
        log("  –", `Lesson #${id} đã có lesson_dialogues — clear scenario_id`);
        if (await clearLessonFields(id, ["scenario_id"], token)) cleared++;
        continue;
      }
      try {
        const diaRes = await request(
          "GET",
          `/items/speaking_dialogues?filter[scenario_id][_eq]=${lesson.scenario_id}&sort=order&limit=-1&fields=id,chinese_text,pinyin,vietnamese_text,speaker,order`,
          null,
          token
        );
        const dialogues = diaRes.data?.data || [];
        for (const d of dialogues) {
          await request("POST", "/items/lesson_dialogues", {
            lesson_id: id,
            chinese_text: d.chinese_text || "",
            pinyin: d.pinyin || null,
            vietnamese_text: d.vietnamese_text || null,
            speaker: d.speaker || "A",
            order: d.order ?? 1,
            status: "published",
          }, token);
        }
        await clearLessonFields(id, ["scenario_id"], token);
        dialogueMigrated += dialogues.length;
        cleared++;
        log("  ✓", `Lesson #${id} → ${dialogues.length} lesson_dialogues, clear scenario_id`);
      } catch (e) {
        log("  ✗", `Lesson #${id} dialogue migrate failed: ${errorToText(e)}`);
      }
    }

    // ── DICTATION: lesson.content → lesson_dictation (1 dòng) ──────────────
    if (type === "dictation") {
      const hasDictation = (dictationCounts.get(String(id)) || 0) > 0;
      if (hasDictation) {
        if (lesson.content || lesson.audio_id) {
          log("  –", `Lesson #${id} đã có lesson_dictation — clear content/audio_id`);
          if (await clearLessonFields(id, ["content", "audio_id"], token)) cleared++;
        }
        continue;
      }
      if (lesson.content) {
        try {
          await request("POST", "/items/lesson_dictation", {
            lesson_id: id,
            audio_id: lesson.audio_id || null,
            answer_text: lesson.content || "",
            sort: 1,
            status: "published",
          }, token);
          await clearLessonFields(id, ["content", "audio_id"], token);
          dictationMigrated++;
          cleared++;
          log("  ✓", `Lesson #${id} → 1 lesson_dictation (answer_text từ content), clear content/audio_id`);
        } catch (e) {
          log("  ✗", `Lesson #${id} dictation migrate failed: ${errorToText(e)}`);
        }
      }
    }

    // ── DỌN FK LỆCH LOẠI (orphan) ──────────────────────────────────────────
    const orphanFields = [];
    if (!VIDEO_TYPES.includes(type) && lesson.video_section_id) orphanFields.push("video_section_id");
    if (!QUIZ_TYPES.includes(type) && lesson.exercise_id) orphanFields.push("exercise_id");
    if (type !== "conversation" && lesson.scenario_id) orphanFields.push("scenario_id");
    if (type !== "dictation" && lesson.content) orphanFields.push("content");
    if (type !== "dictation" && lesson.audio_id) orphanFields.push("audio_id");
    if (lesson.resource_collection) orphanFields.push("resource_collection");
    if (orphanFields.length > 0) {
      if (await clearLessonFields(id, orphanFields, token)) {
        cleared++;
        log("  –", `Lesson #${id} dọn orphan FK: ${orphanFields.join(", ")}`);
      }
    }
  }

  console.log("");
  log("✓", `Done. Video: ${videoMigrated}, Questions: ${quizMigrated}, Dialogues: ${dialogueMigrated}, Dictation: ${dictationMigrated}, Orphan cleared: ${cleared}.`);
  console.log("");
  console.log("Còn lại cần nhập tay:");
  console.log("  - vocab_theory : card lý thuyết (lesson_theory_cards) — giữ vocab_display_map_id.");
  console.log("");
  console.log("Sau khi migrate xong, xóa field legacy bằng:");
  console.log("  node scripts/cleanup-course-legacy.js --apply");
  console.log("");
}

main().catch((e) => {
  console.error("Unhandled error:", errorToText(e));
  process.exit(1);
});
