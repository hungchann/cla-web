/**
 * scripts/setup-course-content-schema.js
 *
 * Tạo (idempotent) schema nội dung khóa học mới trên Directus.
 *
 * Nguyên tắc mới: mỗi lesson tự chứa nội dung riêng (admin tự điền/upload),
 * không lấy từ các collection content khác (video_section / link_exercise /
 * speaking_scenarios / vocab_display_map cho lý thuyết cards bổ sung).
 *
 * ⭐ TRẢI NGHIỆM NHẬP LIỆU: mọi thứ nhập NGAY TRONG 1 FORM lesson
 *   - Video bài giảng: upload `video_file` (mp4) + `srt_file` ngay trên course_lessons
 *   - Từ vựng theo thời gian / câu hỏi / card lý thuyết / câu chính tả / hội thoại:
 *     nhập INLINE qua o2m (hiện ngay trong form lesson, bấm "+" để thêm dòng,
 *     không phải chuyển sang collection khác). Các collection con chỉ là nơi lưu dữ liệu.
 *
 * Các collection được tạo (được nhóm trong sidebar Directus):
 *   - lesson_vocab         : từ vựng theo thời gian của video (time_start/time_end)
 *   - lesson_questions     : quiz riêng của từng lesson (kèm audio câu hỏi tùy chọn)
 *   - lesson_theory_cards  : card lý thuyết tự điền (rich text + ảnh) — bổ sung cho vocab_theory
 *   - lesson_dictation     : nhiều câu chính tả (audio + đáp án chữ Trung để chấm)
 *   - lesson_dialogues     : hội thoại riêng của course (copy field speaking_dialogues)
 *   - banners              : ảnh carousel quảng cáo khóa học trên dashboard
 *
 * Đồng thời thêm vào course_lessons: `video_file`, `srt_file`, `video_cover`
 * (upload trực tiếp) + các o2m alias (lesson_vocab, lesson_questions, ...).
 * (Field hiện/ẩn theo lesson_type được xử lý ở scripts/apply-course-field-conditions.js)
 *
 * Run:
 *   $env:DIRECTUS_ADMIN_EMAIL="admin@marutek.space"
 *   $env:DIRECTUS_ADMIN_PASSWORD="***"
 *   node scripts/setup-course-content-schema.js
 */

const https = require("node:https");
const { URL } = require("node:url");
const readline = require("node:readline");

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";

const STATUS_FIELD = {
  field: "status",
  type: "string",
  schema: { name: "status", data_type: "varchar", max_length: 50, is_nullable: false, default_value: "draft" },
  meta: {
    interface: "select-dropdown",
    options: {
      choices: [
        { text: "Published", value: "published" },
        { text: "Draft", value: "draft" },
        { text: "Archived", value: "archived" },
      ],
    },
    display: "labels",
    display_options: {
      choices: [
        { text: "Published", value: "published", foreground: "#FFFFFF", background: "#2ECDA7" },
        { text: "Draft", value: "draft", foreground: "#FFFFFF", background: "#B3B3B3" },
        { text: "Archived", value: "archived", foreground: "#FFFFFF", background: "#FF7B7B" },
      ],
    },
    sort: 90,
    width: "half",
    note: "Trạng thái hiển thị",
  },
};

const AUDIO_FIELD = (note) => ({
  field: "audio_id",
  type: "uuid",
  schema: { name: "audio_id", data_type: "char", max_length: 36, is_nullable: true, foreign_key_table: "directus_files", foreign_key_column: "id" },
  meta: { interface: "file", display: "file", readonly: false, hidden: false, sort: 60, width: "half", note },
});

const LESSON_ID_FIELD = {
  field: "lesson_id",
  type: "uuid",
  schema: { name: "lesson_id", data_type: "char", max_length: 36, is_nullable: false, foreign_key_table: "course_lessons", foreign_key_column: "id" },
  meta: {
    interface: "select-dropdown-m2o",
    options: { template: "{{id}} — {{title}}" },
    display: "related-values",
    display_options: { template: "{{title}}" },
    readonly: false,
    hidden: false,
    sort: 1,
    width: "full",
    note: "Bài học chứa nội dung này",
  },
};

const COURSE_LESSON_VIDEO_FIELDS = [
  { field: "video_file", type: "uuid", schema: { name: "video_file", data_type: "char", max_length: 36, is_nullable: true, foreign_key_table: "directus_files", foreign_key_column: "id" }, meta: { interface: "file", display: "file", sort: 20, width: "half", note: "🎬 Video MP4 tải từ máy lên (video_vocab / video_grammar)" } },
  { field: "srt_file", type: "uuid", schema: { name: "srt_file", data_type: "char", max_length: 36, is_nullable: true, foreign_key_table: "directus_files", foreign_key_column: "id" }, meta: { interface: "file", display: "file", sort: 21, width: "half", note: "📄 File phụ đề SRT (dòng 1 chữ Trung, dòng 2 pinyin, dòng 3+ nghĩa Việt)" } },
  { field: "video_cover", type: "uuid", schema: { name: "video_cover", data_type: "char", max_length: 36, is_nullable: true, foreign_key_table: "directus_files", foreign_key_column: "id" }, meta: { interface: "file", display: "file", sort: 22, width: "half", note: "Ảnh bìa video (tùy chọn)" } },
];

const LESSON_VOCAB_COLLECTION = {
  collection: "lesson_vocab",
  schema: { name: "lesson_vocab" },
  meta: { hidden: false, singleton: false, icon: "translate", note: "Từ vựng xuất hiện theo thời gian của video bài học" },
  fields: [
    { field: "id", type: "integer", schema: { is_primary_key: true, has_auto_increment: true }, meta: { hidden: true, interface: "input", readonly: true } },
    LESSON_ID_FIELD,
    { field: "word", type: "string", schema: { name: "word", data_type: "varchar", max_length: 255, is_nullable: false }, meta: { interface: "input", sort: 2, width: "half", note: "Từ tiếng Trung" } },
    { field: "pinyin", type: "string", schema: { name: "pinyin", data_type: "varchar", max_length: 255, is_nullable: true }, meta: { interface: "input", sort: 3, width: "half", note: "Phiên âm" } },
    { field: "meaning", type: "string", schema: { name: "meaning", data_type: "varchar", max_length: 500, is_nullable: true }, meta: { interface: "input", sort: 4, width: "full", note: "Nghĩa tiếng Việt" } },
    { field: "time_start", type: "string", schema: { name: "time_start", data_type: "varchar", max_length: 20, is_nullable: true }, meta: { interface: "input", sort: 5, width: "half", note: "Bắt đầu hiện (format 00:00:04,000)" } },
    { field: "time_end", type: "string", schema: { name: "time_end", data_type: "varchar", max_length: 20, is_nullable: true }, meta: { interface: "input", sort: 6, width: "half", note: "Kết thúc hiện (format 00:00:04,000)" } },
    { field: "sort", type: "integer", schema: { name: "sort", data_type: "integer", is_nullable: true }, meta: { interface: "input", sort: 7, width: "half", note: "Thứ tự" } },
    STATUS_FIELD,
  ],
};

const LESSON_QUESTIONS_COLLECTION = {
  collection: "lesson_questions",
  schema: { name: "lesson_questions" },
  meta: { hidden: false, singleton: false, icon: "quiz", note: "Câu hỏi trắc nghiệm riêng của từng bài học" },
  fields: [
    { field: "id", type: "integer", schema: { is_primary_key: true, has_auto_increment: true }, meta: { hidden: true, interface: "input", readonly: true } },
    LESSON_ID_FIELD,
    { field: "question", type: "text", schema: { name: "question", data_type: "text", is_nullable: false }, meta: { interface: "input-multiline", sort: 2, width: "full", note: "Câu hỏi" } },
    { field: "answer_A", type: "string", schema: { name: "answer_A", data_type: "varchar", max_length: 500, is_nullable: true }, meta: { interface: "input", sort: 3, width: "half", note: "Đáp án A" } },
    { field: "answer_B", type: "string", schema: { name: "answer_B", data_type: "varchar", max_length: 500, is_nullable: true }, meta: { interface: "input", sort: 4, width: "half", note: "Đáp án B" } },
    { field: "answer_C", type: "string", schema: { name: "answer_C", data_type: "varchar", max_length: 500, is_nullable: true }, meta: { interface: "input", sort: 5, width: "half", note: "Đáp án C" } },
    { field: "answer_D", type: "string", schema: { name: "answer_D", data_type: "varchar", max_length: 500, is_nullable: true }, meta: { interface: "input", sort: 6, width: "half", note: "Đáp án D" } },
    { field: "correct_answer", type: "string", schema: { name: "correct_answer", data_type: "varchar", max_length: 1, is_nullable: true }, meta: { interface: "select-dropdown", options: { choices: [{ text: "A", value: "A" }, { text: "B", value: "B" }, { text: "C", value: "C" }, { text: "D", value: "D" }] }, sort: 7, width: "half", note: "Đáp án đúng (A/B/C/D)" } },
    { field: "explanation", type: "text", schema: { name: "explanation", data_type: "text", is_nullable: true }, meta: { interface: "input-multiline", sort: 8, width: "full", note: "Giải thích đáp án (hiển thị sau khi trả lời)" } },
    AUDIO_FIELD("🔊 Audio câu hỏi (tùy chọn)"),
    { field: "sort", type: "integer", schema: { name: "sort", data_type: "integer", is_nullable: true }, meta: { interface: "input", sort: 80, width: "half", note: "Thứ tự câu hỏi" } },
    STATUS_FIELD,
  ],
};

const LESSON_THEORY_CARDS_COLLECTION = {
  collection: "lesson_theory_cards",
  schema: { name: "lesson_theory_cards" },
  meta: { hidden: false, singleton: false, icon: "article", note: "Card lý thuyết tự điền (rich text + ảnh) cho bài học" },
  fields: [
    { field: "id", type: "integer", schema: { is_primary_key: true, has_auto_increment: true }, meta: { hidden: true, interface: "input", readonly: true } },
    LESSON_ID_FIELD,
    { field: "title", type: "string", schema: { name: "title", data_type: "varchar", max_length: 255, is_nullable: true }, meta: { interface: "input", sort: 2, width: "full", note: "Tiêu đề card" } },
    { field: "content", type: "text", schema: { name: "content", data_type: "text", is_nullable: true }, meta: { interface: "input-rich-text-html", sort: 3, width: "full", note: "Nội dung lý thuyết — viết chữ, chèn được ảnh" } },
    { field: "image_id", type: "uuid", schema: { name: "image_id", data_type: "char", max_length: 36, is_nullable: true, foreign_key_table: "directus_files", foreign_key_column: "id" }, meta: { interface: "file", display: "file", sort: 4, width: "full", note: "🖼️ Ảnh minh họa (upload từ máy)" } },
    { field: "sort", type: "integer", schema: { name: "sort", data_type: "integer", is_nullable: true }, meta: { interface: "input", sort: 5, width: "half", note: "Thứ tự card" } },
    STATUS_FIELD,
  ],
};

const LESSON_DICTATION_COLLECTION = {
  collection: "lesson_dictation",
  schema: { name: "lesson_dictation" },
  meta: { hidden: false, singleton: false, icon: "hearing", note: "Câu nghe chép chính tả (mỗi dòng = 1 audio + 1 đáp án)" },
  fields: [
    { field: "id", type: "integer", schema: { is_primary_key: true, has_auto_increment: true }, meta: { hidden: true, interface: "input", readonly: true } },
    LESSON_ID_FIELD,
    AUDIO_FIELD("🔊 File audio của câu này"),
    { field: "answer_text", type: "text", schema: { name: "answer_text", data_type: "text", is_nullable: false }, meta: { interface: "input-multiline", sort: 3, width: "full", note: "Đáp án chữ tiếng Trung chuẩn (hệ thống dùng để chấm điểm)" } },
    { field: "sort", type: "integer", schema: { name: "sort", data_type: "integer", is_nullable: true }, meta: { interface: "input", sort: 4, width: "half", note: "Thứ tự câu" } },
    STATUS_FIELD,
  ],
};

const LESSON_DIALOGUES_COLLECTION = {
  collection: "lesson_dialogues",
  schema: { name: "lesson_dialogues" },
  meta: { hidden: false, singleton: false, icon: "forum", note: "Hội thoại của bài thực hành (copy field speaking_dialogues)" },
  fields: [
    { field: "id", type: "integer", schema: { is_primary_key: true, has_auto_increment: true }, meta: { hidden: true, interface: "input", readonly: true } },
    LESSON_ID_FIELD,
    { field: "chinese_text", type: "text", schema: { name: "chinese_text", data_type: "text", is_nullable: false }, meta: { interface: "input-multiline", sort: 2, width: "full", note: "Câu tiếng Trung" } },
    { field: "pinyin", type: "string", schema: { name: "pinyin", data_type: "varchar", max_length: 500, is_nullable: true }, meta: { interface: "input", sort: 3, width: "full", note: "Phiên âm" } },
    { field: "vietnamese_text", type: "string", schema: { name: "vietnamese_text", data_type: "varchar", max_length: 500, is_nullable: true }, meta: { interface: "input", sort: 4, width: "full", note: "Nghĩa tiếng Việt" } },
    { field: "speaker", type: "string", schema: { name: "speaker", data_type: "varchar", max_length: 10, is_nullable: false, default_value: "A" }, meta: { interface: "select-dropdown", options: { choices: [{ text: "A", value: "A" }, { text: "B", value: "B" }] }, sort: 5, width: "half", note: "Nhân vật A / B" } },
    { field: "order", type: "integer", schema: { name: "order", data_type: "integer", is_nullable: false, default_value: 1 }, meta: { interface: "input", sort: 6, width: "half", note: "Thứ tự câu thoại" } },
    STATUS_FIELD,
  ],
};

const BANNERS_COLLECTION = {
  collection: "banners",
  schema: { name: "banners" },
  meta: { hidden: false, singleton: false, icon: "view_carousel", note: "Ảnh carousel quảng cáo khóa học trên dashboard" },
  fields: [
    { field: "id", type: "integer", schema: { is_primary_key: true, has_auto_increment: true }, meta: { hidden: true, interface: "input", readonly: true } },
    { field: "image", type: "uuid", schema: { name: "image", data_type: "char", max_length: 36, is_nullable: true, foreign_key_table: "directus_files", foreign_key_column: "id" }, meta: { interface: "file", display: "file", sort: 1, width: "full", note: "🖼️ Ảnh banner" } },
    { field: "link", type: "string", schema: { name: "link", data_type: "varchar", max_length: 500, is_nullable: true }, meta: { interface: "input", sort: 2, width: "half", note: "Đường dẫn khi click (vd /courses/3)" } },
    { field: "sort", type: "integer", schema: { name: "sort", data_type: "integer", is_nullable: true }, meta: { interface: "input", sort: 3, width: "half", note: "Thứ tự hiển thị" } },
    STATUS_FIELD,
  ],
};

const COLLECTIONS = [
  LESSON_VOCAB_COLLECTION,
  LESSON_QUESTIONS_COLLECTION,
  LESSON_THEORY_CARDS_COLLECTION,
  LESSON_DICTATION_COLLECTION,
  LESSON_DIALOGUES_COLLECTION,
  BANNERS_COLLECTION,
];

/** Định nghĩa o2m alias + relation cho từng collection con */
const LESSON_ALIASES = [
  { collection: "lesson_vocab", one_field: "lesson_vocab", sort_field: "sort", note: "📖 Từ vựng theo thời gian (video_vocab)" },
  { collection: "lesson_questions", one_field: "lesson_questions", sort_field: "sort", note: "📝 Câu hỏi trắc nghiệm (quiz_vocab / quiz_grammar)" },
  { collection: "lesson_theory_cards", one_field: "lesson_theory_cards", sort_field: "sort", note: "🗂️ Card lý thuyết tự điền (vocab_theory)" },
  { collection: "lesson_dictation", one_field: "lesson_dictation", sort_field: "sort", note: "🎧 Câu nghe chép chính tả (dictation)" },
  { collection: "lesson_dialogues", one_field: "lesson_dialogues", sort_field: "order", note: "💬 Hội thoại thực hành (conversation)" },
];

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

async function collectionExists(collection, token) {
  try {
    const res = await request("GET", "/collections", null, token);
    const list = res.data?.data || [];
    return list.some((c) => c && c.collection === collection);
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
    if (f.field === "id") continue;
    if (existingNames.has(f.field)) {
      log("  –", `SKIP ${collection}.${f.field} (already exists)`);
      continue;
    }
    try {
      await createField(collection, f, token);
      log("  ✓", `ADD  ${collection}.${f.field}`);
    } catch (e) {
      log("  ✗", `FAIL ${collection}.${f.field}: ${errorToText(e)}`);
    }
  }
}

async function snapshotHasTable(name, token) {
  try {
    const res = await request("GET", "/schema/snapshot", null, token);
    const snap = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
    return snap.includes(`"table":"${name}"`);
  } catch {
    return false;
  }
}

async function ensureCollection(def, token) {
  const name = def.collection;
  const hasTable = await snapshotHasTable(name, token);
  const metaExists = await collectionExists(name, token);

  if (hasTable) {
    log("✓", `'${name}' có bảng dữ liệu thật — rà field còn thiếu…`);
    await addFieldsIfMissing(name, def.fields, token);
    return true;
  }

  if (metaExists) {
    log("·", `'${name}' chỉ có metadata (thiếu bảng) — tạo lại bảng qua API…`);
  } else {
    log("·", `Tạo collection '${name}' qua API…`);
  }
  try {
    await request("POST", "/collections", { collection: def.collection, schema: def.schema, meta: def.meta }, token);
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

/** Tạo o2m alias (one_field) trên course_lessons cho collection con */
async function ensureLessonAlias(alias, token) {
  const { collection, one_field, sort_field, note } = alias;

  // 1. Đảm bảo alias field TỒN TẠI trên course_lessons.
  //    Instance này KHÔNG tự tạo alias field khi tạo relation — phải POST
  //    field type=alias + special=["o2m"] (xem scripts/add-o2m-aliases.js).
  try {
    const existing = await listFields("course_lessons", token);
    const hasField = existing.some((f) => f.field === one_field);
    if (!hasField) {
      try {
        await request("POST", "/fields/course_lessons", {
          field: one_field,
          type: "alias",
          schema: null,
          meta: {
            interface: "list-o2m",
            special: ["o2m"],
            display: "related-values",
            display_options: { template: "{{title}}" },
            readonly: false,
            hidden: false,
            sort: 30,
            width: "full",
            note,
          },
        }, token);
        log("  ✓", `Create alias field course_lessons.${one_field} (type=alias, special=o2m)`);
      } catch (e) {
        // Instance này không trả o2m alias field qua GET /fields, nhưng field có thể đã tồn tại.
        const msg = errorToText(e);
        if (/already exists/i.test(msg)) {
          log("  –", `Alias field course_lessons.${one_field} đã tồn tại (GET /fields không liệt kê o2m alias)`);
        } else {
          log("  ✗", `Create alias field course_lessons.${one_field}: ${msg}`);
        }
      }
    } else {
      log("  –", `Alias field course_lessons.${one_field} đã tồn tại`);
    }
  } catch (e) {
    log("  –", `List fields course_lessons: ${errorToText(e)}`);
  }

  // 2. Relation m2o trên collection con (lesson_id → course_lessons)
  try {
    await request("PATCH", `/relations/${collection}/lesson_id`, { meta: { one_field, sort_field, sort_field_enabled: true } }, token);
    log("  ✓", `Relation ${collection}.lesson_id → course_lessons.${one_field}`);
  } catch (e) {
    try {
      await request("POST", "/relations", {
        collection,
        field: "lesson_id",
        related_collection: "course_lessons",
        meta: { one_field, sort_field, sort_field_enabled: true },
      }, token);
      log("  ✓", `Relation ${collection}.lesson_id → course_lessons.${one_field}`);
    } catch (postErr) {
      log("  ✗", `Relation ${collection}.lesson_id: ${errorToText(postErr)}`);
    }
  }

  // 3. Cấu hình meta cho alias field (interface list-o2m, hiện rõ trong form)
  try {
    await request("PATCH", `/fields/course_lessons/${one_field}`, {
      meta: {
        interface: "list-o2m",
        display: "related-values",
        display_options: { template: `{{title}}` },
        readonly: false,
        hidden: false,
        sort: 30,
        width: "full",
        note,
      },
    }, token);
    log("  ✓", `Meta course_lessons.${one_field} (list-o2m)`);
  } catch (e) {
    log("  –", `Meta course_lessons.${one_field}: ${errorToText(e)}`);
  }
}

/** Tạo 1 nhóm collection trong sidebar Directus (để đỡ rối). Trả về false nếu instance không hỗ trợ. */
async function ensureGroup(key, name, icon, token) {
  try {
    const res = await request("GET", `/directus_groups?filter[key][_eq]=${encodeURIComponent(key)}&limit=1`, null, token);
    if (res.data?.data?.length) {
      log("  –", `Group '${key}' đã tồn tại`);
      return true;
    }
  } catch (e) {
    if (e.status === 404 || e.data?.errors?.[0]?.extensions?.code === "ROUTE_NOT_FOUND") {
      log("  –", `Instance không hỗ trợ 'directus_groups' — bỏ qua gom nhóm collection.`);
      return false;
    }
    log("  –", `Group '${key}': ${errorToText(e)}`);
    return false;
  }
  try {
    await request("POST", "/directus_groups", { key, name, icon }, token);
    log("  ✓", `Tạo group '${name}'`);
    return true;
  } catch (e) {
    log("  –", `Group '${key}': ${errorToText(e)}`);
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

  // 1. Tạo các collection mới (lesson_* + banners)
  for (const def of COLLECTIONS) {
    await ensureCollection(def, token);
    console.log("");
  }

  // 2. Thêm video upload trực tiếp lên course_lessons (video_file/srt_file/video_cover)
  if (await collectionExists("course_lessons", token)) {
    log("·", "course_lessons: thêm video_file / srt_file / video_cover (upload trực tiếp)…");
    await addFieldsIfMissing("course_lessons", COURSE_LESSON_VIDEO_FIELDS, token);
  }
  console.log("");

  // 3. Tạo o2m alias trên course_lessons cho các collection con (nhập inline trong form lesson)
  log("·", "Thiết lập o2m alias trên course_lessons (nhập inline trong form lesson)…");
  for (const alias of LESSON_ALIASES) {
    await ensureLessonAlias(alias, token);
  }
  console.log("");

  // 4. Gom các collection con vào 1 nhóm trong sidebar Directus cho đỡ rối
  //    (chỉ khi instance hỗ trợ /directus_groups)
  log("·", "Nhóm collection trong sidebar Directus…");
  const groupReady = await ensureGroup("cla_course_content", "Khóa học · Nội dung bài học", "menu_book", token);
  if (groupReady) {
    for (const c of ["course", "course_chapters", "course_lessons", "lesson_vocab", "lesson_questions", "lesson_theory_cards", "lesson_dictation", "lesson_dialogues", "banners"]) {
      if (await collectionExists(c, token)) {
        try {
          await request("PATCH", `/collections/${c}`, { meta: { group: "cla_course_content" } }, token);
        } catch (e) {
          log("  –", `group ${c}: ${errorToText(e)}`);
        }
      }
    }
  } else {
    log("  –", "Bỏ qua gom nhóm collection (instance không hỗ trợ directus_groups).");
  }
  console.log("");

  log("✓", "Done.");
  console.log("");
  console.log("Next steps:");
  console.log("  1. Chạy: node scripts/apply-course-field-conditions.js  (hiện/ẩn field theo lesson_type).");
  console.log("  2. Nếu cần copy dữ liệu cũ sang model mới: node scripts/migrate-course-content.js");
  console.log("  3. Cấp quyền read (role user) cho: lesson_vocab, lesson_questions, lesson_theory_cards, lesson_dictation, lesson_dialogues, banners");
  console.log("  4. Nhập bài: mở Content → course_lessons → Add Item → chọn lesson_type →");
  console.log("     upload video + nhập nội dung INLINE ngay trong form (bấm '+' ở mục liên quan).");
  console.log("  5. Thêm ảnh banner trong banners (image + link + status=published).");
  console.log("");
}

main().catch((e) => {
  console.error("Unhandled error:", errorToText(e));
  process.exit(1);
});
