/**
 * scripts/setup-course-split-schema.js
 *
 * PHASE 2 — Tách nội dung theo loại bài ra khỏi `course_lessons`.
 *
 * Mục tiêu: `course_lessons` chỉ còn field nền (id, title, title_trans,
 * lesson_type, sort, status, chapter_id) + o2m alias. Các field scalar theo loại
 * bài được chuyển sang collection con 1:1:
 *
 *   lesson_video   (1:1) video_file, srt_file, video_cover          → video_vocab / video_grammar
 *   lesson_theory  (1:1) vocab_display_map_id                       → vocab_theory
 *   lesson_extra   (1:1) extra_pdf_id, extra_answer_id, extra_audio_id → extra
 *
 * Các collection con cũ giữ nguyên: lesson_vocab, lesson_questions,
 * lesson_theory_cards, lesson_dictation, lesson_dialogues.
 *
 * Cách hoạt động (AN TOÀN):
 *   1. Tạo 3 collection mới + o2m alias trên course_lessons.
 *   2. Migrate: copy giá trị scalar từ lesson sang collection con (idempotent).
 *   3. Chỉ khi chạy với `--apply`: xóa 7 scalar field khỏi course_lessons,
 *      nhưng CHỈ khi tất cả lesson của loại tương ứng đã có dòng con.
 *
 * Run:
 *   $env:DIRECTUS_ADMIN_EMAIL="admin@education.com"
 *   $env:DIRECTUS_ADMIN_PASSWORD="***"
 *   node scripts/setup-course-split-schema.js            # tạo schema + migrate (không xóa field)
 *   node scripts/setup-course-split-schema.js --apply    # + xóa scalar field (sau khi xác nhận)
 */

const https = require("node:https");
const readline = require("node:readline");
const { URL } = require("node:url");

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";
const APPLY = process.argv.includes("--apply");

const STATUS_FIELD = {
  field: "status",
  type: "string",
  schema: { name: "status", data_type: "varchar", max_length: 50, is_nullable: false, default_value: "published" },
  meta: {
    interface: "select-dropdown",
    options: {
      choices: [
        { text: "Published", value: "published" },
        { text: "Draft", value: "draft" },
        { text: "Archived", value: "archived" },
      ],
    },
    sort: 90,
    width: "half",
    note: "Trạng thái hiển thị",
  },
};

const FILE_FIELD = (field, note, sort) => ({
  field,
  type: "uuid",
  schema: { name: field, data_type: "char", max_length: 36, is_nullable: true, foreign_key_table: "directus_files", foreign_key_column: "id" },
  meta: { interface: "file", display: "file", sort, width: "half", note },
});

/** Field sort — bắt buộc vì relation o2m khai báo sort_field="sort". */
const SORT_FIELD = {
  field: "sort",
  type: "integer",
  schema: { name: "sort", data_type: "integer", is_nullable: true, default_value: 1 },
  meta: { interface: "input", sort: 80, width: "half", note: "Thứ tự sắp xếp (relation o2m dùng)" },
};

/** lesson_id 1:1 — unique để mỗi lesson chỉ có 1 dòng con. */
const LESSON_ID_1_1 = {
  field: "lesson_id",
  type: "uuid",
  schema: { name: "lesson_id", data_type: "char", max_length: 36, is_nullable: false, is_unique: true, foreign_key_table: "course_lessons", foreign_key_column: "id" },
  meta: {
    interface: "select-dropdown-m2o",
    options: { template: "{{id}} — {{title}}" },
    display: "related-values",
    display_options: { template: "{{title}}" },
    sort: 1,
    width: "full",
    note: "Bài học sở hữu nội dung này (1:1)",
  },
};

const COLLECTION_DEFS = [
  {
    collection: "lesson_video",
    meta: { hidden: true, singleton: false, icon: "movie", note: "Video bài giảng 1:1 (video_vocab / video_grammar)" },
    fields: [
      { field: "id", type: "integer", schema: { is_primary_key: true, has_auto_increment: true }, meta: { hidden: true, readonly: true } },
      LESSON_ID_1_1,
      FILE_FIELD("video_file", "🎬 Video MP4 tải từ máy lên", 2),
      FILE_FIELD("srt_file", "📄 File phụ đề SRT (dòng 1 chữ Trung, dòng 2 pinyin, dòng 3+ nghĩa Việt)", 3),
      FILE_FIELD("video_cover", "Ảnh bìa video (tùy chọn)", 4),
      SORT_FIELD,
      STATUS_FIELD,
    ],
  },
  {
    collection: "lesson_theory",
    meta: { hidden: true, singleton: false, icon: "article", note: "Lý thuyết 1:1 (vocab_theory) — chọn nhóm từ vựng từ từ điển" },
    fields: [
      { field: "id", type: "integer", schema: { is_primary_key: true, has_auto_increment: true }, meta: { hidden: true, readonly: true } },
      LESSON_ID_1_1,
      {
        field: "vocab_display_map_id",
        type: "string",
        schema: { name: "vocab_display_map_id", data_type: "char", max_length: 36, is_nullable: true, foreign_key_table: "vocab_display_map", foreign_key_column: "id" },
        meta: { interface: "select-dropdown-m2o", options: { template: "{{id}} — {{topic_id.name}}" }, display: "related-values", display_options: { template: "{{topic_id.name}}" }, sort: 2, width: "full", note: "📖 Nhóm từ vựng từ từ điển" },
      },
      SORT_FIELD,
      STATUS_FIELD,
    ],
  },
  {
    collection: "lesson_extra",
    meta: { hidden: true, singleton: false, icon: "download", note: "Bài tập bổ sung 1:1 (extra) — file tải" },
    fields: [
      { field: "id", type: "integer", schema: { is_primary_key: true, has_auto_increment: true }, meta: { hidden: true, readonly: true } },
      LESSON_ID_1_1,
      FILE_FIELD("extra_pdf_id", "📄 File PDF Đề bài", 2),
      FILE_FIELD("extra_answer_id", "✅ File PDF Đáp án", 3),
      FILE_FIELD("extra_audio_id", "🔊 File Audio kèm theo", 4),
      SORT_FIELD,
      STATUS_FIELD,
    ],
  },
];

const ALIASES = [
  { collection: "lesson_video", one_field: "lesson_video", sort_field: "sort", note: "🎬 Video bài giảng (video_vocab / video_grammar)" },
  { collection: "lesson_theory", one_field: "lesson_theory", sort_field: "sort", note: "📖 Lý thuyết: nhóm từ vựng từ từ điển (vocab_theory)" },
  { collection: "lesson_extra", one_field: "lesson_extra", sort_field: "sort", note: "📥 Bài tập bổ sung (extra)" },
];

/** Scalar field trên course_lessons cần chuyển sang collection con. */
const SCALAR_FIELDS_TO_REMOVE = [
  "video_file",
  "srt_file",
  "video_cover",
  "vocab_display_map_id",
  "extra_pdf_id",
  "extra_answer_id",
  "extra_audio_id",
];

const TYPE_MAP = [
  { types: ["video_vocab", "video_grammar"], collection: "lesson_video", fields: ["video_file", "srt_file", "video_cover"] },
  { types: ["vocab_theory"], collection: "lesson_theory", fields: ["vocab_display_map_id"] },
  { types: ["extra"], collection: "lesson_extra", fields: ["extra_pdf_id", "extra_answer_id", "extra_audio_id"] },
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

async function collectionExists(collection, token) {
  try {
    const res = await request("GET", "/collections", null, token);
    return res.data?.data?.some((c) => c && c.collection === collection) || false;
  } catch {
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
  try {
    const res = await request("GET", `/fields/${collection}`, null, token);
    return res.data?.data || [];
  } catch {
    return [];
  }
}

async function addFieldsIfMissing(collection, fields, token) {
  const existing = new Set((await listFields(collection, token)).map((f) => f.field));
  for (const f of fields) {
    if (f.field === "id") continue;
    if (existing.has(f.field)) {
      log("  –", `SKIP ${collection}.${f.field} (đã tồn tại)`);
      continue;
    }
    try {
      await request("POST", `/fields/${collection}`, f, token);
      log("  ✓", `ADD ${collection}.${f.field}`);
    } catch (e) {
      log("  ✗", `FAIL ${collection}.${f.field}: ${errorToText(e)}`);
    }
  }
}

async function ensureCollection(def, token) {
  const name = def.collection;
  const exists = await collectionExists(name, token);
  if (exists) {
    log("–", `'${name}' đã tồn tại — rà field còn thiếu.`);
    await addFieldsIfMissing(name, def.fields, token);
    return;
  }
  try {
    await request("POST", "/collections", { collection: name, schema: { name }, meta: def.meta }, token);
    log("✓", `Tạo '${name}' thành công.`);
    await addFieldsIfMissing(name, def.fields, token);
  } catch (e) {
    log("✗", `Tạo '${name}' thất bại: ${errorToText(e)}`);
  }
}

/** Tạo o2m alias field + relation trên course_lessons (tolerant "already exists"). */
async function ensureAlias(alias, token) {
  const { collection, one_field, sort_field, note } = alias;
  try {
    const existing = new Set((await listFields("course_lessons", token)).map((f) => f.field));
    if (!existing.has(one_field)) {
      try {
        await request("POST", "/fields/course_lessons", {
          field: one_field,
          type: "alias",
          schema: null,
          meta: { interface: "list-o2m", special: ["o2m"], display: "related-values", display_options: { template: "{{id}}" }, readonly: false, hidden: false, sort: 30, width: "full", note },
        }, token);
        log("  ✓", `Create alias field course_lessons.${one_field}`);
      } catch (e) {
        const msg = errorToText(e);
        if (/already exists/i.test(msg)) log("  –", `Alias field course_lessons.${one_field} đã tồn tại`);
        else log("  ✗", `Create alias course_lessons.${one_field}: ${msg}`);
      }
    }
  } catch (e) {
    log("  –", `List fields course_lessons: ${errorToText(e)}`);
  }
  try {
    await request("PATCH", `/relations/${collection}/lesson_id`, { meta: { one_field, sort_field, sort_field_enabled: true } }, token);
    log("  ✓", `Relation ${collection}.lesson_id → course_lessons.${one_field}`);
  } catch (e) {
    try {
      await request("POST", "/relations", { collection, field: "lesson_id", related_collection: "course_lessons", meta: { one_field, sort_field, sort_field_enabled: true } }, token);
      log("  ✓", `Relation ${collection}.lesson_id → course_lessons.${one_field}`);
    } catch (postErr) {
      log("  ✗", `Relation ${collection}.lesson_id: ${errorToText(postErr)}`);
    }
  }
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
  log("→", `Mode: ${APPLY ? "APPLY (sẽ xóa scalar field)" : "SCHEMA + MIGRATE (không xóa field)"}`);
  console.log("");

  const creds = await promptCredentials();
  const token = await login(creds);
  log("✓", "Logged in.");
  console.log("");

  // 1. Tạo 3 collection con
  for (const def of COLLECTION_DEFS) {
    await ensureCollection(def, token);
    console.log("");
  }

  // 2. o2m alias trên course_lessons
  log("·", "Thiết lập o2m alias trên course_lessons…");
  for (const alias of ALIASES) await ensureAlias(alias, token);
  console.log("");

  // 3. Migrate dữ liệu scalar → collection con (idempotent)
  const existingFields = new Set((await listFields("course_lessons", token)).map((f) => f.field));
  const scalarAvailable = SCALAR_FIELDS_TO_REMOVE.filter((f) => existingFields.has(f));
  log("·", `Scalar field hiện có trên course_lessons: ${scalarAvailable.join(", ") || "(không còn)"}`);
  console.log("");

  if (scalarAvailable.length > 0) {
    const lessons = await fetchAll("course_lessons", `id,lesson_type,status,${scalarAvailable.join(",")}`, token);
    log(`·`, `Migrate ${lessons.length} lessons…`);
    for (const m of TYPE_MAP) {
      const childRows = await fetchAll(m.collection, "id,lesson_id", token);
      const existingLessonIds = new Set(childRows.map((r) => String(r.lesson_id)));
      const targets = lessons.filter((l) => m.types.includes(l.lesson_type));
      for (const l of targets) {
        if (existingLessonIds.has(String(l.id))) {
          log("  –", `lesson #${l.id} [${m.collection}] đã có dòng con — skip`);
          continue;
        }
        const body = { lesson_id: l.id, sort: 1, status: "published" };
        for (const f of m.fields) body[f] = l[f] || null;
        try {
          await request("POST", `/items/${m.collection}`, body, token);
          log("  ✓", `lesson #${l.id} [${l.lesson_type}] → ${m.collection} (${m.fields.map((f) => `${f}=${l[f] ? "✓" : "—"}`).join(", ")})`);
        } catch (e) {
          log("  ✗", `lesson #${l.id} → ${m.collection} failed: ${errorToText(e)}`);
        }
      }
    }
    console.log("");
  }

  // 4. Xóa scalar field (chỉ khi --apply và mọi lesson của loại đã có dòng con)
  if (scalarAvailable.length > 0) {
    log("=== XÓA SCALAR FIELD ===");
    const lessons = await fetchAll("course_lessons", "id,lesson_type,status,chapter_id,title", token);
    for (const m of TYPE_MAP) {
      const childRows = await fetchAll(m.collection, "id,lesson_id", token);
      const childIds = new Set(childRows.map((r) => String(r.lesson_id)));
      const targets = lessons.filter((l) => m.types.includes(l.lesson_type));
      const missing = targets.filter((l) => !childIds.has(String(l.id)));
      const affectedFields = m.fields.filter((f) => scalarAvailable.includes(f));
      if (affectedFields.length === 0) continue;

      if (missing.length > 0) {
        log("✗", `${m.collection}: còn ${missing.length} lesson chưa có dòng con (${missing.map((l) => l.id).join(", ")}) — KHÔNG xóa ${affectedFields.join(", ")}`);
        continue;
      }
      for (const f of affectedFields) {
        if (APPLY) {
          try {
            await request("DELETE", `/fields/course_lessons/${f}`, null, token);
            log("  ✓", `ĐÃ XÓA course_lessons.${f}`);
          } catch (e) {
            log("  ✗", `DELETE course_lessons.${f}: ${errorToText(e)}`);
          }
        } else {
          log("  ·", `(dry-run) sẽ xóa course_lessons.${f}`);
        }
      }
    }
    console.log("");
  }

  if (!APPLY) {
    log("→", "Chạy lại với `--apply` để xóa scalar field khỏi course_lessons.");
  } else {
    log("✓", "Hoàn tất Phase 2 schema.");
    log("→", "Bước tiếp theo: cập nhật frontend (courses.ts, types, learn page) để đọc từ lesson_video / lesson_theory / lesson_extra.");
  }
  console.log("");
}

main().catch((e) => {
  console.error("Unhandled error:", errorToText(e));
  process.exit(1);
});
