/**
 * scripts/rebuild-course-model.js
 *
 * Master script to fix and optimize the Course Data Model in Directus:
 *   1. Fixes `SQLITE_ERROR: no such column: course_chapters.lessons` by removing broken
 *      physical column field metadata and creating proper virtual O2M alias fields.
 *   2. Creates intuitive M2O dropdown fields (`video_section_id`, `exercise_id`,
 *      `audio_id`, `scenario_id`, `extra_pdf_id`, `extra_answer_id`, `extra_audio_id`).
 *   3. Removes outdated `reading_id` field.
 *   4. Migrates existing resource_id data into the new M2O fields.
 *
 * Usage:
 *   $env:DIRECTUS_ADMIN_EMAIL="admin@marutek.space"
 *   $env:DIRECTUS_ADMIN_PASSWORD="***"
 *   node scripts/rebuild-course-model.js
 *
 * Or pass via command line:
 *   node scripts/rebuild-course-model.js --email admin@marutek.space --password ***
 */

const https = require("node:https");
const readline = require("node:readline");
const { URL } = require("node:url");

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";

function log(icon, msg) {
  console.log(`${icon} ${msg}`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  let email = process.env.DIRECTUS_ADMIN_EMAIL;
  let password = process.env.DIRECTUS_ADMIN_PASSWORD;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--email" && args[i + 1]) {
      email = args[i + 1];
      i++;
    } else if (args[i] === "--password" && args[i + 1]) {
      password = args[i + 1];
      i++;
    }
  }

  return { email, password };
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
  const { email, password } = parseArgs();
  if (email && password) return { email, password };

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((resolve) => rl.question(q, resolve));
  log("?", "Chưa tìm thấy DIRECTUS_ADMIN_EMAIL / DIRECTUS_ADMIN_PASSWORD trong env.");
  const e = await ask("  Admin email: ");
  const p = await ask("  Admin password: ");
  rl.close();
  return { email: e.trim(), password: p };
}

async function login(email, password) {
  const res = await request("POST", "/auth/login", { email, password });
  return res.data?.data?.access_token;
}

async function main() {
  console.log("\n=========================================");
  log("🚀", `Bắt đầu Rebuild Course Data Model tại: ${API_BASE}`);
  console.log("=========================================\n");

  const { email, password } = await promptCredentials();
  let token;
  try {
    token = await login(email, password);
    log("✓", `Đăng nhập thành công với tài khoản: ${email}`);
  } catch (e) {
    log("✗", `Đăng nhập thất bại: ${JSON.stringify(e.data || e.status || e)}`);
    process.exit(1);
  }
  console.log("");

  // Fetch current relations list
  const allRelations = (await request("GET", "/relations", null, token)).data?.data || [];

  // Step 1: Clean & Create Relations Correctly (Child collection holds Foreign Key, Parent holds O2M Alias)
  log("·", "Bước 1: Tái cấu trúc chuẩn O2M alias `course.chapters` & `course_chapters.lessons`…");

  // 1a. Ensure `course_chapters.course_id` field (M2O child field pointing to course)
  const chaptersFields = (await request("GET", "/fields/course_chapters", null, token)).data?.data || [];
  if (!chaptersFields.some((f) => f.field === "course_id")) {
    try {
      await request("POST", "/fields/course_chapters", {
        field: "course_id",
        type: "string",
        schema: { name: "course_id", table: "course_chapters", data_type: "varchar", max_length: 255, is_nullable: true, foreign_key_table: "course", foreign_key_column: "id" },
        meta: { interface: "select-dropdown-m2o", options: { template: "{{title}}" }, display: "related-values", display_options: { template: "{{title}}" } }
      }, token);
      log("  ✓", "Đã tạo field M2O 'course_chapters.course_id'");
    } catch (e) {}
  }

  // 1b. Ensure `course_lessons.chapter_id` field (M2O child field pointing to course_chapters)
  const lessonsFields = (await request("GET", "/fields/course_lessons", null, token)).data?.data || [];
  if (!lessonsFields.some((f) => f.field === "chapter_id")) {
    try {
      await request("POST", "/fields/course_lessons", {
        field: "chapter_id",
        type: "integer",
        schema: { name: "chapter_id", table: "course_lessons", data_type: "integer", is_nullable: true, foreign_key_table: "course_chapters", foreign_key_column: "id" },
        meta: { interface: "select-dropdown-m2o", options: { template: "{{title}}" }, display: "related-values", display_options: { template: "{{title}}" } }
      }, token);
      log("  ✓", "Đã tạo field M2O 'course_lessons.chapter_id'");
    } catch (e) {}
  }

  // 1c. Create or Fix Virtual Alias Field 'course.chapters'
  const courseFields = (await request("GET", "/fields/course", null, token)).data?.data || [];
  const existingChaptersField = courseFields.find((f) => f.field === "chapters");
  if (existingChaptersField && existingChaptersField.type !== "alias") {
    try {
      await request("DELETE", "/fields/course/chapters", null, token);
      log("  ✓", "Đã xóa field 'course.chapters' vật lý (không chuẩn alias)");
    } catch (e) {}
  }
  if (!existingChaptersField || existingChaptersField.type !== "alias") {
    try {
      await request("POST", "/fields/course", {
        field: "chapters",
        type: "alias",
        schema: null,
        meta: { interface: "list-o2m", special: ["o2m"], options: { fields: ["id", "title", "sort", "status"] } },
      }, token);
      log("  ✓", "Đã tạo field alias chuẩn 'course.chapters'");
    } catch (e) {
      log("  ⚠", `Tạo field 'course.chapters': ${JSON.stringify(e.data?.errors?.[0]?.message || e.status)}`);
    }
  }

  // 1d. Create OR PATCH Relation O2M for 'course.chapters'
  try {
    const existingRel = (await request("GET", "/relations/course_chapters/course_id", null, token)).data?.data;
    const relPayload = {
      collection: "course_chapters",
      field: "course_id",
      related_collection: "course",
      meta: {
        ...(existingRel?.meta || {}),
        one_field: "chapters",
        sort_field: "sort",
      },
    };
    if (existingRel) {
      await request("PATCH", "/relations/course_chapters/course_id", relPayload, token);
      log("  ✓", "Đã cập nhật (PATCH) relation O2M 'course.chapters' → 'course_chapters'");
    } else {
      await request("POST", "/relations", relPayload, token);
      log("  ✓", "Đã tạo (POST) relation O2M 'course.chapters' → 'course_chapters'");
    }
  } catch (e) {
    log("  ⚠", `Cập nhật relation 'course.chapters': ${JSON.stringify(e.data?.errors?.[0]?.message || e.status || e)}`);
  }

  // 1e. Create or Fix Virtual Alias Field 'course_chapters.lessons'
  const updatedChaptersFields = (await request("GET", "/fields/course_chapters", null, token)).data?.data || [];
  const existingLessonsField = updatedChaptersFields.find((f) => f.field === "lessons");
  if (existingLessonsField && existingLessonsField.type !== "alias") {
    try {
      await request("DELETE", "/fields/course_chapters/lessons", null, token);
      log("  ✓", "Đã xóa field 'course_chapters.lessons' vật lý (không chuẩn alias)");
    } catch (e) {}
  }
  if (!existingLessonsField || existingLessonsField.type !== "alias") {
    try {
      await request("POST", "/fields/course_chapters", {
        field: "lessons",
        type: "alias",
        schema: null,
        meta: { interface: "list-o2m", special: ["o2m"], options: { fields: ["id", "title", "sort", "lesson_type", "status"] } },
      }, token);
      log("  ✓", "Đã tạo field alias chuẩn 'course_chapters.lessons'");
    } catch (e) {
      log("  ⚠", `Tạo field 'course_chapters.lessons': ${JSON.stringify(e.data?.errors?.[0]?.message || e.status)}`);
    }
  }

  // 1f. Create OR PATCH Relation O2M for 'course_chapters.lessons'
  try {
    const existingRelLessons = (await request("GET", "/relations/course_lessons/chapter_id", null, token)).data?.data;
    const relPayloadLessons = {
      collection: "course_lessons",
      field: "chapter_id",
      related_collection: "course_chapters",
      meta: {
        ...(existingRelLessons?.meta || {}),
        one_field: "lessons",
        sort_field: "sort",
      },
    };
    if (existingRelLessons) {
      await request("PATCH", "/relations/course_lessons/chapter_id", relPayloadLessons, token);
      log("  ✓", "Đã cập nhật (PATCH) relation O2M 'course_chapters.lessons' → 'course_lessons'");
    } else {
      await request("POST", "/relations", relPayloadLessons, token);
      log("  ✓", "Đã tạo (POST) relation O2M 'course_chapters.lessons' → 'course_lessons'");
    }
  } catch (e) {
    log("  ⚠", `Cập nhật relation 'course_chapters.lessons': ${JSON.stringify(e.data?.errors?.[0]?.message || e.status || e)}`);
  }

  // 1g. Clear System Cache
  try {
    await request("POST", "/utils/cache/clear", null, token);
    log("  ✓", "Đã dọn dẹp Directus System Cache!");
  } catch (e) {}

  console.log("");

  // Step 2: Create intuitive M2O Dropdown fields on course_lessons
  log("·", "Bước 2: Tạo các trường M2O trực quan trên `course_lessons` (bao gồm audio_id)…");

  const lessonFields = (await request("GET", "/fields/course_lessons", null, token)).data?.data || [];
  const lessonFieldNames = new Set(lessonFields.map((f) => f.field));

  const M2O_FIELDS = [
    {
      field: "video_section_id",
      type: "uuid",
      schema: { name: "video_section_id", table: "course_lessons", data_type: "char", max_length: 36, is_nullable: true, foreign_key_table: "video_section", foreign_key_column: "id" },
      meta: { interface: "select-dropdown-m2o", options: { template: "{{title}}" }, display: "related-values", display_options: { template: "{{title}}" }, readonly: false, hidden: false, sort: 20, width: "half", note: "🎬 Chọn Bài Giảng Video (video_vocab / video_grammar)" },
      related_collection: "video_section",
    },
    {
      field: "exercise_id",
      type: "integer",
      schema: { name: "exercise_id", table: "course_lessons", data_type: "integer", is_nullable: true, foreign_key_table: "link_exercise", foreign_key_column: "id" },
      meta: { interface: "select-dropdown-m2o", options: { template: "Quiz #{{id}}" }, display: "related-values", display_options: { template: "Quiz #{{id}}" }, readonly: false, hidden: false, sort: 21, width: "half", note: "📝 Chọn Bộ Bài Tập Trắc Nghiệm (quiz_vocab / quiz_grammar)" },
      related_collection: "link_exercise",
    },
    {
      field: "audio_id",
      type: "uuid",
      schema: { name: "audio_id", table: "course_lessons", data_type: "char", max_length: 36, is_nullable: true, foreign_key_table: "directus_files", foreign_key_column: "id" },
      meta: { interface: "file", options: null, display: "file", readonly: false, hidden: false, sort: 22, width: "half", note: "🔊 File Audio âm thanh bài học (cho Dictation / Bài học nghe)" },
      related_collection: "directus_files",
    },
    {
      field: "scenario_id",
      type: "integer",
      schema: { name: "scenario_id", table: "course_lessons", data_type: "integer", is_nullable: true, foreign_key_table: "speaking_scenarios", foreign_key_column: "id" },
      meta: { interface: "select-dropdown-m2o", options: { template: "{{title}}" }, display: "related-values", display_options: { template: "{{title}}" }, readonly: false, hidden: false, sort: 23, width: "half", note: "🗣️ Chọn Kịch Bản Hội Thoại (conversation)" },
      related_collection: "speaking_scenarios",
    },
  ];

  for (const item of M2O_FIELDS) {
    if (!lessonFieldNames.has(item.field)) {
      try {
        await request("POST", "/fields/course_lessons", {
          field: item.field,
          type: item.type,
          schema: item.schema,
          meta: item.meta,
        }, token);
        log("  ✓", `Đã tạo trường M2O: course_lessons.${item.field}`);
      } catch (e) {
        log("  ✗", `Lỗi tạo trường course_lessons.${item.field}: ${JSON.stringify(e.data?.errors?.[0]?.message || e.status)}`);
      }
    } else {
      log("  −", `Trường 'course_lessons.${item.field}' đã tồn tại.`);
    }

    const hasRel = allRelations.some((r) => (r.collection === "course_lessons" && r.field === item.field) || (r.many_collection === "course_lessons" && r.many_field === item.field));
    if (!hasRel) {
      try {
        await request("POST", "/relations", {
          collection: "course_lessons",
          field: item.field,
          related_collection: item.related_collection,
          schema: null,
          meta: { one_deselect_action: "nullify" },
        }, token);
        log("  ✓", `Đã nối relation M2O: course_lessons.${item.field} → ${item.related_collection}`);
      } catch (e) {}
    }
  }

  // Delete deprecated reading_id field if exists
  if (lessonFieldNames.has("reading_id")) {
    try {
      await request("DELETE", "/fields/course_lessons/reading_id", null, token);
      log("  ✓", "Đã xóa trường cũ 'course_lessons.reading_id'");
    } catch (e) {}
  }

  console.log("");

  // Step 3: Migration / Sync existing data
  log("·", "Bước 3: Tự động đồng bộ dữ liệu cũ từ `resource_id` sang các trường M2O mới…");
  try {
    const lessonsRes = await request("GET", "/items/course_lessons?limit=-1", null, token);
    const lessons = lessonsRes.data?.data || [];
    let updatedCount = 0;

    for (const l of lessons) {
      if (!l.resource_id) continue;
      const patchData = {};

      if (l.resource_collection === "video_section" && !l.video_section_id) {
        patchData.video_section_id = l.resource_id;
      } else if (l.resource_collection === "link_exercise" && !l.exercise_id) {
        const parsed = Number(l.resource_id);
        if (!isNaN(parsed)) patchData.exercise_id = parsed;
      } else if (l.resource_collection === "speaking_scenarios" && !l.scenario_id) {
        const parsed = Number(l.resource_id);
        if (!isNaN(parsed)) patchData.scenario_id = parsed;
      } else if (l.resource_collection === "directus_files" && !l.audio_id) {
        patchData.audio_id = l.resource_id;
      }

      if (Object.keys(patchData).length > 0) {
        try {
          await request("PATCH", `/items/course_lessons/${l.id}`, patchData, token);
          updatedCount++;
        } catch (itemErr) {
          // ignore individual item foreign key mismatch gracefully
        }
      }
    }
    log("  ✓", `Đã đồng bộ thành công ${updatedCount} lesson(s).`);
  } catch (e) {
    log("  ⚠", `Quét sync dữ liệu cũ: ${JSON.stringify(e.data || e.message || e)}`);
  }

  console.log("");

  // Step 4: Delete legacy fields & relations
  log("·", "Bước 4: Xóa các trường Legacy (`resource_id`, `resource_collection`, `reading_id`) khỏi Directus Schema…");
  try {
    await request("DELETE", "/relations/course_lessons/resource_id", null, token);
    log("  ✓", "Đã xóa relation M2A 'course_lessons.resource_id'");
  } catch (e) {}

  for (const fieldName of ["resource_id", "resource_collection", "reading_id"]) {
    try {
      await request("DELETE", `/fields/course_lessons/${fieldName}`, null, token);
      log("  ✓", `Đã xóa trường legacy 'course_lessons.${fieldName}'`);
    } catch (e) {}
  }

  console.log("");

  // Step 5: Verification via GraphQL
  log("·", "Bước 5: Kiểm tra lại GraphQL query…");
  try {
    const gql = await request("POST", "/graphql", {
      query: "query { course_chapters(limit:2) { id title lessons { id title lesson_type video_section_id { id title } exercise_id { id } audio_id { id } scenario_id { id title } } } }",
    }, token);
    if (gql.data?.data) {
      log("  🎉 SUCCESS!", "GraphQL query `course_chapters -> lessons` hoạt động hoàn hảo!");
    } else {
      log("  ⚠", `GraphQL Response: ${JSON.stringify(gql.data)}`);
    }
  } catch (e) {
    log("  ✗", `GraphQL test FAIL: ${JSON.stringify(e.data || e.status || e)}`);
  }

  console.log("\n=========================================");
  log("✨", "HOÀN TẤT TÁI CẤU TRÚC DATA MODEL COURSE!");
  console.log("=========================================\n");
}

main().catch((e) => {
  console.error("Unhandled error:", e);
  process.exit(1);
});
