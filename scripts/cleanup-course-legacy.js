/**
 * scripts/cleanup-course-legacy.js
 *
 * Dọn dẹp các field legacy trên collection `course_lessons` sau khi đã xác nhận
 * dữ liệu cũ đã được migrate sang model mới (video_file/srt_file trực tiếp,
 * lesson_vocab / lesson_questions / lesson_theory_cards / lesson_dictation /
 * lesson_dialogues).
 *
 * Các field legacy cần dọn:
 *   - video_section_id  (video cũ)     → thay bằng video_file + srt_file
 *   - course_video_id   (video trung gian) → thay bằng video_file + srt_file
 *   - exercise_id       (bài tập cũ)   → thay bằng lesson_questions
 *   - scenario_id       (hội thoại cũ) → thay bằng lesson_dialogues
 *   - audio_id          (chính tả cũ)  → thay bằng lesson_dictation
 *   - content           (đáp án chính tả cũ) → thay bằng lesson_dictation
 *   - resource_id / resource_collection (M2A cũ) → đã bỏ
 *
 * Cách hoạt động (AN TOÀN):
 *   1. Audit: đếm số bản ghi còn dùng từng field legacy.
 *   2. Nếu field còn data nhưng nội dung mới tương đương ĐÃ TỒN TẠI
 *      (vd lesson có course_video_id nhưng cũng có video_file) → PATCH field
 *      legacy thành NULL (dữ liệu legacy không còn ý nghĩa).
 *   3. Chỉ DELETE field khi chắc chắn 0 bản ghi còn giữ giá trị.
 *
 * Mặc định chạy ở chế độ `--dry-run` (chỉ in báo cáo). Muốn thực hiện xóa:
 *   node scripts/cleanup-course-legacy.js --apply
 *
 * Run:
 *   $env:DIRECTUS_ADMIN_EMAIL="admin@education.com"
 *   $env:DIRECTUS_ADMIN_PASSWORD="***"
 *   node scripts/cleanup-course-legacy.js            # audit (không sửa gì)
 *   node scripts/cleanup-course-legacy.js --apply    # xóa field đã xác nhận trống
 */

const https = require("node:https");
const readline = require("node:readline");
const { URL } = require("node:url");

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";
const APPLY = process.argv.includes("--apply");

const LEGACY_FIELDS = [
  "video_section_id",
  "course_video_id",
  "exercise_id",
  "scenario_id",
  "audio_id",
  "content",
  "resource_collection",
  "resource_id",
];

/** Field mới tương đương (nếu đã có giá trị thì field legacy chỉ là dư thừa). */
const NEW_EQUIVALENT = {
  video_section_id: "video_file",
  course_video_id: "video_file",
  exercise_id: null, // quiz: kiểm tra lesson_questions bằng số dòng
  scenario_id: null, // conversation: kiểm tra lesson_dialogues bằng số dòng
  audio_id: null, // dictation: kiểm tra lesson_dictation bằng số dòng
  content: null,
  resource_collection: null,
  resource_id: null,
};

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

/** Đếm số dòng con (lesson_vocab / lesson_questions / ...) của từng lesson. */
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

async function main() {
  console.log("");
  log("→", `Directus target: ${API_BASE}`);
  log("→", `Mode: ${APPLY ? "APPLY (sẽ PATCH NULL + DELETE field)" : "DRY-RUN (chỉ báo cáo)"}`);
  console.log("");

  const creds = await promptCredentials();
  const token = await login(creds);
  log("✓", "Logged in.");
  console.log("");

  // 1. Danh sách field hiện có trên course_lessons
  const existingFields = new Set((await listFields("course_lessons", token)).map((f) => f.field));
  log("·", `Field thực tế trên course_lessons: ${existingFields.size} field.`);
  const existingLegacy = LEGACY_FIELDS.filter((f) => existingFields.has(f));
  const missingLegacy = LEGACY_FIELDS.filter((f) => !existingFields.has(f));
  if (missingLegacy.length > 0) {
    log("  –", `Field legacy KHÔNG tồn tại (đã dọn trước): ${missingLegacy.join(", ")}`);
  }
  console.log("");

  // 2. Tải toàn bộ lessons — chỉ query field hiện có (tránh 403/does-not-exist)
  const baseFields = ["id", "lesson_type", "status", "chapter_id"];
  const newFields = ["video_file", "srt_file", "extra_pdf_id", "extra_answer_id", "extra_audio_id", "vocab_display_map_id"];
  const fieldsToQuery = [
    ...baseFields,
    ...existingLegacy,
    ...newFields.filter((f) => existingFields.has(f)),
  ];
  let lessons = [];
  try {
    const res = await request(
      "GET",
      `/items/course_lessons?limit=-1&fields=${fieldsToQuery.join(",")}`,
      null,
      token
    );
    lessons = res.data?.data || [];
  } catch (e) {
    log("✗", `Không đọc được course_lessons: ${errorToText(e)}`);
    process.exit(1);
  }
  log(`·`, `Tổng số course_lessons: ${lessons.length}`);
  console.log("");

  // 3. Đếm số dòng con cho quiz / conversation / dictation (để biết legacy có dư thừa không)
  const questionCounts = await countChildren("lesson_questions", token);
  const dialogueCounts = await countChildren("lesson_dialogues", token);
  const dictationCounts = await countChildren("lesson_dictation", token);
  console.log("");

  // 4. Audit từng field legacy
  log("=== AUDIT FIELD LEGACY ===");
  const usage = {}; // field -> { total, ids: [] }
  for (const field of existingLegacy) {
    usage[field] = { total: 0, ids: [] };
    for (const l of lessons) {
      const v = l[field];
      const hasValue = v !== null && v !== undefined && v !== "";
      if (hasValue) {
        usage[field].total++;
        usage[field].ids.push(String(l.id));
      }
    }
  }

  const dictationIds = new Set(lessons.filter((l) => l.lesson_type === "dictation").map((l) => String(l.id)));
  const videoIds = new Set(lessons.filter((l) => ["video_vocab", "video_grammar"].includes(l.lesson_type)).map((l) => String(l.id)));
  const quizIds = new Set(lessons.filter((l) => ["quiz_vocab", "quiz_grammar"].includes(l.lesson_type)).map((l) => String(l.id)));
  const conversationIds = new Set(lessons.filter((l) => l.lesson_type === "conversation").map((l) => String(l.id)));

  /**
   * Field legacy có dư thừa (an toàn clear) khi:
   *   - lesson đúng loại bài VÀ nội dung mới tương đương đã tồn tại, HOẶC
   *   - field legacy nằm trên lesson KHÔNG thuộc loại bài tương ứng (orphan — dư thừa chắc chắn).
   */
  const isRedundant = (field, id) => {
    const hasNew = {
      video_section_id: () => videoIds.has(id) && !!lessons.find((x) => String(x.id) === id)?.video_file,
      course_video_id: () => videoIds.has(id) && !!lessons.find((x) => String(x.id) === id)?.video_file,
      exercise_id: () => quizIds.has(id) && (questionCounts.get(id) || 0) > 0,
      scenario_id: () => conversationIds.has(id) && (dialogueCounts.get(id) || 0) > 0,
      audio_id: () => dictationIds.has(id) && (dictationCounts.get(id) || 0) > 0,
      content: () => dictationIds.has(id) && (dictationCounts.get(id) || 0) > 0,
      resource_collection: () => true, // M2A cũ, resource_id đã xóa → luôn orphan
      resource_id: () => true,
    };
    if (hasNew[field]) return hasNew[field]();
    return !videoIds.has(id) && !quizIds.has(id) && !conversationIds.has(id) && !dictationIds.has(id);
  };

  for (const field of existingLegacy) {
    const u = usage[field];
    if (u.total === 0) {
      log("✓", `${field}: TRỐNG (0 bản ghi) — an toàn để xóa.`);
      continue;
    }
    // Có data → kiểm tra xem có dư thừa (nội dung mới đã tồn tại) không.
    const ids = [...u.ids];
    const redundant = ids.filter((id) => isRedundant(field, id)).length;

    if (redundant === u.total) {
      log("✓", `${field}: có ${u.total} bản ghi nhưng TẤT CẢ ĐÃ CÓ nội dung mới (redundant) — an toàn để PATCH NULL + xóa.`);
    } else {
      log("✗", `${field}: còn ${u.total - redundant}/${u.total} bản ghi CHƯA có nội dung mới — KHÔNG xóa (cần migrate trước).`);
      log("  ", `   Ví dụ lesson id: ${ids.slice(0, 10).join(", ")}`);
    }
  }
  console.log("");

  // 5. Quyết định xử lý
  const deletable = [];
  const patchable = [];
  for (const field of existingLegacy) {
    const u = usage[field];
    if (u.total === 0) {
      deletable.push(field);
      continue;
    }
    const ids = [...u.ids];
    const redundant = ids.filter((id) => isRedundant(field, id)).length;
    if (redundant === u.total) {
      patchable.push({ field, ids });
      deletable.push(field);
    }
  }

  if (deletable.length === 0) {
    log("·", "Không có field legacy nào an toàn để xóa ngay. Chạy migrate trước hoặc kiểm tra dữ liệu thủ công.");
    console.log("");
    return;
  }

  log(`=== THỰC HIỆN (${APPLY ? "APPLY" : "DRY-RUN"}) ===`);
  for (const field of deletable) {
    const existing = existingFields.has(field);
    if (!existing) {
      log("  –", `${field}: không tồn tại (bỏ qua).`);
      continue;
    }
    // PATCH NULL các giá trị legacy còn dư thừa trước khi xóa field
    const patchInfo = patchable.find((p) => p.field === field);
    if (patchInfo) {
      for (const id of patchInfo.ids) {
        if (APPLY) {
          try {
            await request("PATCH", `/items/course_lessons/${id}`, { [field]: null }, token);
            log("  ✓", `${field}: PATCH NULL lesson #${id}`);
          } catch (e) {
            log("  ✗", `${field}: PATCH #${id} lỗi: ${errorToText(e)}`);
          }
        } else {
          log("  ·", `${field}: sẽ PATCH NULL lesson #${id}`);
        }
      }
    }
    if (APPLY) {
      try {
        await request("DELETE", `/fields/course_lessons/${field}`, null, token);
        log("  ✓", `${field}: ĐÃ XÓA field.`);
      } catch (e) {
        log("  ✗", `${field}: DELETE field lỗi: ${errorToText(e)}`);
      }
    } else {
      log("  ·", `${field}: (dry-run) sẽ DELETE field nếu chạy với --apply.`);
    }
  }
  console.log("");

  if (!APPLY) {
    log("→", "Đây là chế độ DRY-RUN — chưa sửa gì. Chạy lại với `--apply` để thực hiện PATCH NULL + DELETE field.");
  } else {
    log("✓", "Hoàn tất cleanup legacy fields.");
    log("→", "Bước tiếp theo: dọn code frontend (courses.ts, types, learn page) — xem hướng dẫn trong docs.");
  }
  console.log("");
}

main().catch((e) => {
  console.error("Unhandled error:", errorToText(e));
  process.exit(1);
});
