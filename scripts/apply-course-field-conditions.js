/**
 * scripts/apply-course-field-conditions.js
 *
 * Cấu hình "field conditions" cho collection `course_lessons` trên Directus
 * để form nhập liệu hiển thị ĐỘNG theo `lesson_type`:
 *   - Chọn video_vocab   → chỉ hiện video_section_id
 *   - Chọn vocab_theory  → chỉ hiện vocab_display_map_id
 *   - Chọn quiz_*        → chỉ hiện exercise_id
 *   - Chọn dictation     → chỉ hiện audio_id + content
 *   - Chọn conversation  → chỉ hiện scenario_id
 *   - Chọn extra         → chỉ hiện extra_pdf_id / extra_answer_id / extra_audio_id
 *
 * Đồng thời:
 *   - Ẩn field legacy `resource_collection` (M2A cũ không còn dùng).
 *   - Cải thiện dropdown `lesson_type` (nhãn tiếng Việt + màu).
 *
 * Idempotent — chạy lại nhiều lần không sao. Chỉ PATCH field đã tồn tại.
 *
 * Run:
 *   $env:DIRECTUS_ADMIN_EMAIL="admin@marutek.space"
 *   $env:DIRECTUS_ADMIN_PASSWORD="***"
 *   node scripts/apply-course-field-conditions.js
 */

const https = require("node:https");
const { URL } = require("node:url");
const readline = require("node:readline");

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";
const COLLECTION = "course_lessons";

/** o2m alias field — nếu thiếu phải POST tạo (type=alias, special=o2m) trước khi PATCH meta. */
const O2M_ALIAS_FIELDS = {
  lesson_video: { note: "🎬 Video bài giảng (video_vocab / video_grammar)" },
  lesson_theory: { note: "📖 Lý thuyết: nhóm từ vựng từ từ điển (vocab_theory)" },
  lesson_extra: { note: "📥 Bài tập bổ sung (extra)" },
  lesson_vocab: { note: "📖 Từ vựng theo thời gian của video (video_vocab)" },
  lesson_questions: { note: "📝 Câu hỏi trắc nghiệm riêng của bài (quiz_vocab / quiz_grammar)" },
  lesson_theory_cards: { note: "🗂️ Card lý thuyết tự điền — chữ + ảnh (vocab_theory)" },
  lesson_dictation: { note: "🎧 Câu nghe chép chính tả — mỗi câu 1 audio + 1 đáp án (dictation)" },
  lesson_dialogues: { note: "💬 Hội thoại thực hành của bài (conversation)" },
};

const LESSON_TYPES = [
  { text: "Video từ vựng", value: "video_vocab" },
  { text: "Lý thuyết từ vựng", value: "vocab_theory" },
  { text: "Bài tập từ vựng", value: "quiz_vocab" },
  { text: "Video ngữ pháp", value: "video_grammar" },
  { text: "Bài tập ngữ pháp", value: "quiz_grammar" },
  { text: "Nghe chép chính tả", value: "dictation" },
  { text: "Thực hành hội thoại", value: "conversation" },
  { text: "Bài tập bổ sung", value: "extra" },
];

const LESSON_TYPE_COLORS = {
  video_vocab: "#2ECDA7",
  vocab_theory: "#A78BFA",
  quiz_vocab: "#2ECDA7",
  video_grammar: "#2F80ED",
  quiz_grammar: "#2F80ED",
  dictation: "#FFB627",
  conversation: "#FF7B7B",
  extra: "#B3B3B3",
};

/**
 * Rule hiện field khi lesson_type nằm trong danh sách cho phép,
 * ẩn field khi không thuộc danh sách.
 */
function showFor(types, { required = false } = {}) {
  return [
    {
      rule: { lesson_type: { _in: types } },
      hidden: false,
      required,
      options: { nullable: true },
    },
  ];
}

function showForType(type, { required = false } = {}) {
  return showFor([type], { required });
}

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
          } catch (e) {
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
  const email = process.env.DIRECTUS_ADMIN_EMAIL;
  const password = process.env.DIRECTUS_ADMIN_PASSWORD;
  if (email && password) return { email, password };
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((resolve) => rl.question(q, resolve));
  log("?", "DIRECTUS_ADMIN_EMAIL / DIRECTUS_ADMIN_PASSWORD chưa được set trong env.");
  const e = await ask("  Admin email: ");
  const p = await ask("  Admin password: ");
  rl.close();
  return { email: e.trim(), password: p };
}

/** Định nghĩa meta đầy đủ cho từng field theo lesson_type */
const FIELD_PATCHES = {
  lesson_type: {
    interface: "select-dropdown",
    options: { choices: LESSON_TYPES },
    display: "labels",
    display_options: {
      choices: LESSON_TYPES.map((c) => ({
        text: c.text,
        value: c.value,
        foreground: "#FFFFFF",
        background: LESSON_TYPE_COLORS[c.value] || "#B3B3B3",
      })),
    },
    note: "Loại bài học — form bên dưới tự động hiện đúng trường cần nhập",
  },
  // ── Model tách collection: nội dung theo loại bài nằm ở collection con 1:1 ─
  lesson_video: {
    interface: "list-o2m",
    note: "🎬 Video bài giảng (video_vocab / video_grammar)",
    hidden: true,
    conditions: showFor(["video_vocab", "video_grammar"]),
  },
  lesson_theory: {
    interface: "list-o2m",
    note: "📖 Lý thuyết: chọn nhóm từ vựng từ từ điển (vocab_theory)",
    hidden: true,
    conditions: showForType("vocab_theory"),
  },
  lesson_extra: {
    interface: "list-o2m",
    note: "📥 Bài tập bổ sung (extra)",
    hidden: true,
    conditions: showForType("extra"),
  },
  // ── o2m nội dung riêng của lesson ────────────────────────────────────────
  lesson_vocab: {
    interface: "list-o2m",
    note: "📖 Từ vựng theo thời gian của video (video_vocab)",
    hidden: true,
    conditions: showForType("video_vocab"),
  },
  lesson_questions: {
    interface: "list-o2m",
    note: "📝 Câu hỏi trắc nghiệm riêng của bài (quiz_vocab / quiz_grammar)",
    hidden: true,
    conditions: showFor(["quiz_vocab", "quiz_grammar"]),
  },
  lesson_theory_cards: {
    interface: "list-o2m",
    note: "🗂️ Card lý thuyết tự điền — chữ + ảnh (vocab_theory)",
    hidden: true,
    conditions: showForType("vocab_theory"),
  },
  lesson_dictation: {
    interface: "list-o2m",
    note: "🎧 Câu nghe chép chính tả — mỗi câu 1 audio + 1 đáp án (dictation)",
    hidden: true,
    conditions: showForType("dictation"),
  },
  lesson_dialogues: {
    interface: "list-o2m",
    note: "💬 Hội thoại thực hành của bài (conversation)",
    hidden: true,
    conditions: showForType("conversation"),
  },
  // ── Giữ: bài tập bổ sung chứa file trong lesson_extra (không còn field scalar) ──
};

async function main() {
  console.log("");
  log("→", `Directus target: ${API_BASE}`);
  log("→", `Collection: ${COLLECTION}`);
  console.log("");

  const { email, password } = await promptCredentials();
  let token;
  try {
    const res = await request("POST", "/auth/login", { email, password });
    token = res.data?.data?.access_token;
    log("✓", `Logged in as ${email}`);
  } catch (e) {
    log("✗", `Login failed: ${JSON.stringify(e.data || e.status || e)}`);
    process.exit(1);
  }
  console.log("");

  let existing;
  try {
    const res = await request("GET", `/fields/${COLLECTION}`, null, token);
    existing = res.data?.data || [];
  } catch (e) {
    log("✗", `Không đọc được field list của '${COLLECTION}': ${JSON.stringify(e.data || e.status || e)}`);
    process.exit(1);
  }
  const existingMap = new Map(existing.map((f) => [f.field, f]));

  let updated = 0;
  let skipped = 0;
  let created = 0;
  for (const [field, patch] of Object.entries(FIELD_PATCHES)) {
    if (!existingMap.has(field)) {
      // o2m alias field chưa xuất hiện trong GET /fields — nhưng có thể đã tồn tại
      // (instance này không trả o2m alias field qua GET /fields, POST sẽ báo "already exists").
      if (O2M_ALIAS_FIELDS[field]) {
        try {
          await request("POST", `/fields/${COLLECTION}`, {
            field,
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
              note: O2M_ALIAS_FIELDS[field].note,
            },
          }, token);
          log("  ✓", `CREATE '${field}' (o2m alias field)`);
          created++;
        } catch (e) {
          const msg = JSON.stringify(e.data?.errors?.[0]?.message || e.data || e.status || e);
          // "already exists" → field thực sự tồn tại, chỉ cần PATCH meta bên dưới.
          if (/already exists/i.test(msg)) {
            log("  ·", `'${field}' đã tồn tại — bỏ qua create, PATCH meta.`);
          } else {
            log("  ✗", `FAIL CREATE '${field}': ${msg}`);
            skipped++;
            continue;
          }
        }
        existingMap.set(field, { meta: {} });
      } else {
        log("  –", `SKIP '${field}' (field không tồn tại)`);
        skipped++;
        continue;
      }
    }
    const current = existingMap.get(field);
    const merged = { ...current.meta, ...patch };
    if (O2M_ALIAS_FIELDS[field]) {
      merged.hidden = true;
      merged.special = ["o2m"];
    }
    try {
      await request("PATCH", `/fields/${COLLECTION}/${field}`, { meta: merged }, token);
      const types = patch.conditions?.[0]?.rule?.lesson_type?._in?.join(", ");
      log("  ✓", `PATCH '${field}'${types ? ` (hiện khi lesson_type ∈ {${types}})` : ""}`);
      updated++;
    } catch (e) {
      log("  ✗", `FAIL '${field}': ${JSON.stringify(e.data?.errors?.[0]?.message || e.data || e.status || e)}`);
    }
  }
  console.log("");

  log("·", `Created ${created}, updated ${updated} field(s), skipped ${skipped}.`);
  log("✓", "Done. Mở Directus Admin → course_lessons → tạo/sửa item để kiểm tra form hiển thị động.");
  console.log("");
}

main().catch((e) => {
  console.error("Unhandled error:", e);
  process.exit(1);
});
