/**
 * scripts/setup-course-schema.js
 *
 * Idempotently set up the `course` / `course_chapters` / `course_lessons` schema
 * on Directus via the REST admin API.
 *
 * What it does:
 *   1. Logs in as admin (env DIRECTUS_ADMIN_EMAIL / DIRECTUS_ADMIN_PASSWORD).
 *   2. For each collection, fetches the current field list.
 *   3. Adds any missing fields (idempotent: skips if field already exists).
 *   4. Sets up the M2A relation for `course_lessons.resource_id` (with
 *      `resource_collection` as the discriminator).
 *   5. Sets up the o2m alias fields (`course.chapters`, `course_chapters.lessons`)
 *      by creating the underlying m2o with the right meta.
 *
 * Run:
 *   $env:DIRECTUS_ADMIN_EMAIL="admin@marutek.space"
 *   $env:DIRECTUS_ADMIN_PASSWORD="***"
 *   node scripts/setup-course-schema.js
 *
 * Or, if you prefer, set the env vars in a `.env.local` file (not committed)
 * and run via `node --env-file=.env.local scripts/setup-course-schema.js`.
 */

const https = require("https");
const { URL } = require("url");
const readline = require("readline");

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";

const COLLECTIONS = ["course", "course_chapters", "course_lessons"];

const FIELDS_TO_ADD = {
  course: [
    {
      field: "title_trans",
      type: "string",
      schema: { name: "title_trans", table: "course", data_type: "varchar", max_length: 255, is_nullable: true },
      meta: { interface: "input", options: null, display: "raw", readonly: false, hidden: false, sort: 8, width: "half", note: "Bản dịch tiêu đề (VN/en)" },
    },
    {
      field: "isBilingual",
      type: "boolean",
      schema: { name: "isBilingual", table: "course", data_type: "boolean", is_nullable: true, default_value: false },
      meta: { interface: "boolean", options: null, display: "boolean", readonly: false, hidden: false, sort: 12, width: "half", note: "Đánh dấu khóa học song ngữ (route sang /bilingual/[id])" },
    },
    {
      field: "subtext",
      type: "string",
      schema: { name: "subtext", table: "course", data_type: "varchar", max_length: 255, is_nullable: true },
      meta: { interface: "input", options: null, display: "raw", readonly: false, hidden: false, sort: 13, width: "half", note: "Phụ đề hiển thị trên card (vd: Học Qua Đọc Hiểu)" },
    },
  ],
  course_chapters: [
    {
      field: "status",
      type: "string",
      schema: { name: "status", table: "course_chapters", data_type: "varchar", max_length: 255, is_nullable: false, default_value: "draft" },
      meta: { interface: "select-dropdown", options: { choices: [{ text: "Published", value: "published" }, { text: "Draft", value: "draft" }, { text: "Archived", value: "archived" }] }, display: "labels", display_options: { choices: [{ text: "Published", value: "published", foreground: "#FFFFFF", background: "#2ECDA7" }, { text: "Draft", value: "draft", foreground: "#FFFFFF", background: "#B3B3B3" }, { text: "Archived", value: "archived", foreground: "#FFFFFF", background: "#FF7B7B" }] }, readonly: false, hidden: false, sort: 2, width: "full", note: "Trạng thái hiển thị" },
    },
    {
      field: "title_trans",
      type: "string",
      schema: { name: "title_trans", table: "course_chapters", data_type: "varchar", max_length: 255, is_nullable: true },
      meta: { interface: "input", options: null, display: "raw", readonly: false, hidden: false, sort: 7, width: "half", note: "Bản dịch tiêu đề" },
    },
    {
      field: "description",
      type: "text",
      schema: { name: "description", table: "course_chapters", data_type: "text", is_nullable: true },
      meta: { interface: "input-multiline", options: null, display: "raw", readonly: false, hidden: false, sort: 9, width: "full", note: "Mô tả chapter" },
    },
    {
      field: "date_created",
      type: "dateTime",
      schema: { name: "date_created", table: "course_chapters", data_type: "datetime", is_nullable: true },
      meta: { interface: "datetime", options: null, display: "datetime", readonly: true, hidden: true, sort: 99, width: "half", note: null, special: ["date-created"] },
    },
    {
      field: "date_updated",
      type: "dateTime",
      schema: { name: "date_updated", table: "course_chapters", data_type: "datetime", is_nullable: true },
      meta: { interface: "datetime", options: null, display: "datetime", readonly: true, hidden: true, sort: 100, width: "half", note: null, special: ["date-updated"] },
    },
    {
      field: "user_created",
      type: "uuid",
      schema: { name: "user_created", table: "course_chapters", data_type: "char", max_length: 36, is_nullable: true, foreign_key_table: "directus_users", foreign_key_column: "id" },
      meta: { interface: "select-dropdown-m2o", options: { template: "{{avatar}} {{first_name}} {{last_name}}" }, display: "user", readonly: true, hidden: true, sort: 97, width: "half", note: null, special: ["user-created"] },
    },
    {
      field: "user_updated",
      type: "uuid",
      schema: { name: "user_updated", table: "course_chapters", data_type: "char", max_length: 36, is_nullable: true, foreign_key_table: "directus_users", foreign_key_column: "id" },
      meta: { interface: "select-dropdown-m2o", options: { template: "{{avatar}} {{first_name}} {{last_name}}" }, display: "user", readonly: true, hidden: true, sort: 98, width: "half", note: null, special: ["user-updated"] },
    },
  ],
  course_lessons: [
    {
      field: "status",
      type: "string",
      schema: { name: "status", table: "course_lessons", data_type: "varchar", max_length: 255, is_nullable: false, default_value: "draft" },
      meta: { interface: "select-dropdown", options: { choices: [{ text: "Published", value: "published" }, { text: "Draft", value: "draft" }, { text: "Archived", value: "archived" }] }, display: "labels", display_options: { choices: [{ text: "Published", value: "published", foreground: "#FFFFFF", background: "#2ECDA7" }, { text: "Draft", value: "draft", foreground: "#FFFFFF", background: "#B3B3B3" }, { text: "Archived", value: "archived", foreground: "#FFFFFF", background: "#FF7B7B" }] }, readonly: false, hidden: false, sort: 2, width: "full", note: "Trạng thái hiển thị" },
    },
    {
      field: "title_trans",
      type: "string",
      schema: { name: "title_trans", table: "course_lessons", data_type: "varchar", max_length: 255, is_nullable: true },
      meta: { interface: "input", options: null, display: "raw", readonly: false, hidden: false, sort: 6, width: "half", note: "Bản dịch tiêu đề" },
    },
    {
      field: "content",
      type: "text",
      schema: { name: "content", table: "course_lessons", data_type: "text", is_nullable: true },
      meta: { interface: "input-multiline", options: null, display: "raw", readonly: false, hidden: false, sort: 7, width: "full", note: "Nội dung chính / expected_text cho dictation" },
    },
    {
      field: "resource_collection",
      type: "string",
      schema: { name: "resource_collection", table: "course_lessons", data_type: "varchar", max_length: 255, is_nullable: true },
      meta: { interface: "select-dropdown", options: { choices: [
        { text: "video_section", value: "video_section" },
        { text: "directus_files", value: "directus_files" },
        { text: "speaking_scenarios", value: "speaking_scenarios" },
        { text: "module_Exercise", value: "module_Exercise" },
        { text: "link_exercise", value: "link_exercise" },
        { text: "topic_of_grammarModule", value: "topic_of_grammarModule" },
      ] }, display: "raw", readonly: false, hidden: false, sort: 11, width: "half", note: "M2A discriminator: collection của resource_id" },
    },
    {
      field: "video_section_id",
      type: "uuid",
      schema: { name: "video_section_id", table: "course_lessons", data_type: "char", max_length: 36, is_nullable: true, foreign_key_table: "video_section", foreign_key_column: "id" },
      meta: { interface: "select-dropdown-m2o", options: { template: "{{title}}" }, display: "related-values", display_options: { template: "{{title}}" }, readonly: false, hidden: false, sort: 20, width: "half", note: "🎬 Chọn Bài Giảng Video (video_vocab / video_grammar)" },
    },
    {
      field: "exercise_id",
      type: "integer",
      schema: { name: "exercise_id", table: "course_lessons", data_type: "integer", is_nullable: true, foreign_key_table: "link_exercise", foreign_key_column: "id" },
      meta: { interface: "select-dropdown-m2o", options: { template: "Quiz #{{id}}" }, display: "related-values", display_options: { template: "Quiz #{{id}}" }, readonly: false, hidden: false, sort: 21, width: "half", note: "📝 Chọn Bộ Bài Tập Trắc Nghiệm (quiz_vocab / quiz_grammar)" },
    },
    {
      field: "audio_id",
      type: "uuid",
      schema: { name: "audio_id", table: "course_lessons", data_type: "char", max_length: 36, is_nullable: true, foreign_key_table: "directus_files", foreign_key_column: "id" },
      meta: { interface: "file", options: null, display: "file", readonly: false, hidden: false, sort: 22, width: "half", note: "🔊 File Audio âm thanh bài học (cho Dictation / Bài học nghe)" },
    },
    {
      field: "scenario_id",
      type: "integer",
      schema: { name: "scenario_id", table: "course_lessons", data_type: "integer", is_nullable: true, foreign_key_table: "speaking_scenarios", foreign_key_column: "id" },
      meta: { interface: "select-dropdown-m2o", options: { template: "{{title}}" }, display: "related-values", display_options: { template: "{{title}}" }, readonly: false, hidden: false, sort: 23, width: "half", note: "🗣️ Chọn Kịch Bản Hội Thoại (conversation)" },
    },
    {
      field: "extra_pdf_id",
      type: "uuid",
      schema: { name: "extra_pdf_id", table: "course_lessons", data_type: "char", max_length: 36, is_nullable: true, foreign_key_table: "directus_files", foreign_key_column: "id" },
      meta: { interface: "file", options: null, display: "file", readonly: false, hidden: false, sort: 12, width: "half", note: "Step 'extra' — file PDF bài tập" },
    },
    {
      field: "extra_answer_id",
      type: "uuid",
      schema: { name: "extra_answer_id", table: "course_lessons", data_type: "char", max_length: 36, is_nullable: true, foreign_key_table: "directus_files", foreign_key_column: "id" },
      meta: { interface: "file", options: null, display: "file", readonly: false, hidden: false, sort: 13, width: "half", note: "Step 'extra' — file PDF đáp án" },
    },
    {
      field: "extra_audio_id",
      type: "uuid",
      schema: { name: "extra_audio_id", table: "course_lessons", data_type: "char", max_length: 36, is_nullable: true, foreign_key_table: "directus_files", foreign_key_column: "id" },
      meta: { interface: "file", options: null, display: "file", readonly: false, hidden: false, sort: 14, width: "half", note: "Step 'extra' — file audio" },
    },
    {
      field: "date_created",
      type: "dateTime",
      schema: { name: "date_created", table: "course_lessons", data_type: "datetime", is_nullable: true },
      meta: { interface: "datetime", options: null, display: "datetime", readonly: true, hidden: true, sort: 99, width: "half", note: null, special: ["date-created"] },
    },
    {
      field: "date_updated",
      type: "dateTime",
      schema: { name: "date_updated", table: "course_lessons", data_type: "datetime", is_nullable: true },
      meta: { interface: "datetime", options: null, display: "datetime", readonly: true, hidden: true, sort: 100, width: "half", note: null, special: ["date-updated"] },
    },
    {
      field: "user_created",
      type: "uuid",
      schema: { name: "user_created", table: "course_lessons", data_type: "char", max_length: 36, is_nullable: true, foreign_key_table: "directus_users", foreign_key_column: "id" },
      meta: { interface: "select-dropdown-m2o", options: { template: "{{avatar}} {{first_name}} {{last_name}}" }, display: "user", readonly: true, hidden: true, sort: 97, width: "half", note: null, special: ["user-created"] },
    },
    {
      field: "user_updated",
      type: "uuid",
      schema: { name: "user_updated", table: "course_lessons", data_type: "char", max_length: 36, is_nullable: true, foreign_key_table: "directus_users", foreign_key_column: "id" },
      meta: { interface: "select-dropdown-m2o", options: { template: "{{avatar}} {{first_name}} {{last_name}}" }, display: "user", readonly: true, hidden: true, sort: 98, width: "half", note: null, special: ["user-updated"] },
    },
  ],
};

const M2A_RELATION = {
  collection: "course_lessons",
  field: "resource_id",
  related_collection: null,
  meta: {
    one_collection_field: "resource_collection",
    one_allowed_collections: [
      "video_section",
      "directus_files",
      "speaking_scenarios",
      "module_Exercise",
      "link_exercise",
      "topic_of_grammarModule",
    ],
    sort_field: null,
    one_deselect_action: "nullify",
  },
};

function log(icon, msg) {
  console.log(`${icon} ${msg}`);
}

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const data = body ? JSON.stringify(body) : null;
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (data) headers["Content-Length"] = Buffer.byteLength(data);
    if (token) headers.Authorization = `Bearer ${token}`;

    const req = https.request(
      {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method,
        headers,
      },
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
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, data: parsed });
          } else {
            reject({ status: res.statusCode, data: parsed });
          }
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

async function login(email, password) {
  const res = await request("POST", "/auth/login", { email, password });
  return res.data?.data?.access_token;
}

async function listFields(collection, token) {
  const res = await request("GET", `/fields/${collection}`, null, token);
  return res.data?.data || [];
}

async function collectionExists(collection, token) {
  try {
    await request("GET", `/collections/${collection}`, null, token);
    return true;
  } catch (e) {
    if (e.status === 404) return false;
    throw e;
  }
}

async function listRelations(token) {
  const res = await request("GET", `/relations`, null, token);
  return res.data?.data || [];
}

async function createField(collection, field, token) {
  return request("POST", `/fields/${collection}`, field, token);
}

async function createRelation(relation, token) {
  return request("POST", `/relations`, relation, token);
}

async function main() {
  console.log("");
  log("→", `Directus target: ${API_BASE}`);
  log("→", `Collections: ${COLLECTIONS.join(", ")}`);
  console.log("");

  const { email, password } = await promptCredentials();
  let token;
  try {
    token = await login(email, password);
    log("✓", `Logged in as ${email}`);
  } catch (e) {
    log("✗", `Login failed: ${JSON.stringify(e.data || e.status || e)}`);
    process.exit(1);
  }
  console.log("");

  // Step 0: Preflight — verify each collection exists
  log("·", "Preflight: verifying collections exist…");
  for (const collection of COLLECTIONS) {
    const exists = await collectionExists(collection, token);
    if (!exists) {
      log("  ✗", `Collection '${collection}' chưa tồn tại trên Directus. Hãy tạo collection trước (xem §1 của plan.md), rồi chạy lại script này.`);
      process.exit(1);
    }
    log("  ✓", `Collection '${collection}' exists`);
  }
  console.log("");

  // Step 1: Add fields
  for (const collection of COLLECTIONS) {
    log("·", `Inspecting '${collection}'…`);
    const existing = await listFields(collection, token);
    const existingNames = new Set(existing.map((f) => f.field));
    const desired = FIELDS_TO_ADD[collection] || [];
    for (const f of desired) {
      if (existingNames.has(f.field)) {
        log("  –", `SKIP field '${f.field}' (already exists)`);
        continue;
      }
      try {
        await createField(collection, f, token);
        log("  ✓", `ADD  field '${f.field}'`);
      } catch (e) {
        log("  ✗", `FAIL field '${f.field}': ${JSON.stringify(e.data || e.status || e)}`);
      }
    }
    console.log("");
  }

  // Step 2: Set up M2A relation for course_lessons.resource_id
  log("·", "Setting up M2A relation for 'course_lessons.resource_id'…");
  const relations = await listRelations(token);
  const hasM2A = relations.some(
    (r) => r.collection === "course_lessons" && r.field === "resource_id"
  );
  if (hasM2A) {
    log("  –", "SKIP M2A relation (already exists)");
  } else {
    try {
      await createRelation(M2A_RELATION, token);
      log("  ✓", "ADD  M2A relation (resource_id + resource_collection)");
    } catch (e) {
      log("  ✗", `FAIL M2A relation: ${JSON.stringify(e.data || e.status || e)}`);
    }
  }
  console.log("");

  // Step 2b: Set up O2M relation metadata for chapters and lessons
  log("·", "Setting up O2M alias relations for course.chapters and course_chapters.lessons…");
  try {
    await request("PATCH", "/relations/course_chapters/course_id", { meta: { one_field: "chapters", sort_field: "sort" } }, token);
    log("  ✓", "Updated relation metadata 'course.chapters'");
  } catch (e) {
    try {
      await request("POST", "/relations", { collection: "course_chapters", field: "course_id", related_collection: "course", meta: { one_field: "chapters", sort_field: "sort" } }, token);
      log("  ✓", "Created relation 'course.chapters'");
    } catch (postErr) {}
  }

  try {
    await request("PATCH", "/relations/course_lessons/chapter_id", { meta: { one_field: "lessons", sort_field: "sort" } }, token);
    log("  ✓", "Updated relation metadata 'course_chapters.lessons'");
  } catch (e) {
    try {
      await request("POST", "/relations", { collection: "course_lessons", field: "chapter_id", related_collection: "course_chapters", meta: { one_field: "lessons", sort_field: "sort" } }, token);
      log("  ✓", "Created relation 'course_chapters.lessons'");
    } catch (postErr) {}
  }
  console.log("");

  // Step 3: Verify
  log("·", "Final verification…");
  for (const collection of COLLECTIONS) {
    const fields = await listFields(collection, token);
    const names = fields.map((f) => f.field).join(", ");
    log("  ", `${collection}: ${fields.length} fields — ${names}`);
  }
  console.log("");

  log("✓", "Done.");
  console.log("");
  console.log("Next steps:");
  console.log("  1. Open Directus Admin → Data Model to verify all fields.");
  console.log("  2. Create sample data:");
  console.log("     - 1 row in `course` (status=published, level=Sơ cấp, script_type=simplified, is_featured=true)");
  console.log("     - 1 row in `course_chapters` (status=published, course_id=<above>, sort=1)");
  console.log("     - 7 rows in `course_lessons` (status=published, chapter_id=<above>, lesson_type=video_vocab/quiz_vocab/video_grammar/quiz_grammar/dictation/conversation/extra)");
  console.log("  3. Then run `node scripts/seed-course-sample.js` (or insert manually).");
  console.log("  4. After schema is verified, switch back to cla-web dev and run the API code patches.");
  console.log("");
}

main().catch((e) => {
  console.error("Unhandled error:", e);
  process.exit(1);
});
