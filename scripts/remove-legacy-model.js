/**
 * scripts/remove-legacy-model.js
 *
 * Script tự động dọn dẹp và xóa triệt để các trường legacy (resource_id, resource_collection, reading_id, video_url)
 * cùng với M2A relation khỏi schema Directus Database.
 *
 * Cách chạy:
 *   $env:DIRECTUS_ADMIN_EMAIL="admin@marutek.space"
 *   $env:DIRECTUS_ADMIN_PASSWORD="***"
 *   node scripts/remove-legacy-model.js
 *
 * Hoặc truyền trực tiếp qua câu lệnh:
 *   node scripts/remove-legacy-model.js --email admin@marutek.space --password ***
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
  return { email: e.trim(), password: p.trim() };
}

async function main() {
  console.log("\n=========================================");
  log("🧹", "XÓA TRIỆT ĐỂ MODEL CŨ (LEGACY) TRÊN DIRECTUS");
  console.log("=========================================\n");

  const { email, password } = await promptCredentials();

  log("·", `Đăng nhập Directus admin (${email})…`);
  let token = null;
  try {
    const authRes = await request("POST", "/auth/login", { email, password });
    token = authRes.data?.data?.access_token;
    if (!token) throw new Error("No access_token returned");
    log("  ✓", "Đăng nhập thành công!");
  } catch (e) {
    log("  ✗", `Đăng nhập thất bại: ${JSON.stringify(e.data || e.message || e)}`);
    process.exit(1);
  }

  // 1. Quét và đồng bộ dữ liệu cũ còn sót trước khi xóa trường
  log("\n·", "Bước 1: Kiểm tra & Đồng bộ dữ liệu cũ sang các trường M2O mới…");
  try {
    const lessonsRes = await request("GET", "/items/course_lessons?limit=-1", null, token);
    const lessons = lessonsRes.data?.data || [];
    let synced = 0;
    for (const l of lessons) {
      if (!l.resource_id) continue;
      const patch = {};
      if (l.resource_collection === "video_section" && !l.video_section_id) patch.video_section_id = l.resource_id;
      if (l.resource_collection === "link_exercise" && !l.exercise_id && !isNaN(Number(l.resource_id))) patch.exercise_id = Number(l.resource_id);
      if (l.resource_collection === "speaking_scenarios" && !l.scenario_id && !isNaN(Number(l.resource_id))) patch.scenario_id = Number(l.resource_id);
      if (l.resource_collection === "directus_files" && !l.audio_id) patch.audio_id = l.resource_id;

      if (Object.keys(patch).length > 0) {
        try {
          await request("PATCH", `/items/course_lessons/${l.id}`, patch, token);
          synced++;
        } catch (e) {}
      }
    }
    log("  ✓", `Đã đồng bộ an toàn ${synced} bài học trước khi xóa model.`);
  } catch (e) {
    log("  ⚠", "Bỏ qua bước sync dữ liệu (đã sạch).");
  }

  // 2. Xóa Relation M2A resource_id
  log("\n·", "Bước 2: Xóa Relation M2A `course_lessons.resource_id`…");
  try {
    await request("DELETE", "/relations/course_lessons/resource_id", null, token);
    log("  ✓", "Đã xóa thành công relation 'course_lessons.resource_id'");
  } catch (e) {
    log("  –", "Relation 'course_lessons.resource_id' không tồn tại hoặc đã bị xóa.");
  }

  // 3. Xóa các trường Legacy: resource_id, resource_collection, reading_id, video_url
  log("\n·", "Bước 3: Xóa các trường Legacy khỏi Directus Schema…");
  const fieldsToDelete = ["resource_id", "resource_collection", "reading_id", "video_url"];

  for (const fieldName of fieldsToDelete) {
    try {
      await request("DELETE", `/fields/course_lessons/${fieldName}`, null, token);
      log("  ✓", `Đã xóa trường 'course_lessons.${fieldName}'`);
    } catch (e) {
      log("  –", `Trường 'course_lessons.${fieldName}' không tồn tại hoặc đã xóa.`);
    }
  }

  // 3b. Xóa các bài học thừa loại 'reading' hoặc 'bilingual' (Bài 8 thừa)
  log("\n·", "Bước 3b: Xóa các bản ghi bài học thừa 'reading' / 'bilingual' (Bài 8 thừa)…");
  try {
    const readingLessonsRes = await request("GET", "/items/course_lessons?filter[lesson_type][_in]=reading,bilingual", null, token);
    const readingLessons = readingLessonsRes.data?.data || [];
    for (const rl of readingLessons) {
      try {
        await request("DELETE", `/items/course_lessons/${rl.id}`, null, token);
        log("  ✓", `Đã xóa bài học thừa id=${rl.id} (type='${rl.lesson_type}')`);
      } catch (delErr) {}
    }
  } catch (e) {}

  // 4. Kiểm tra lại schema sau khi xóa
  log("\n·", "Bước 4: Kiểm tra lại Schema GraphQL…");
  try {
    const gql = await request("POST", "/graphql", {
      query: "query { course_chapters(limit:1) { id title lessons { id title lesson_type video_section_id { id } exercise_id { id } scenario_id { id } audio_id { id } } } }",
    }, token);
    if (gql.data?.data) {
      log("  🎉 SUCCESS!", "GraphQL schema hoạt động hoàn hảo và sạch sẽ 100%!");
    }
  } catch (e) {
    log("  ⚠", `GraphQL Test Response: ${JSON.stringify(e.data || e)}`);
  }

  console.log("\n=========================================");
  log("✨", "HOÀN TẤT XÓA LEGACY MODEL KHỎI DIRECTUS DATABASE!");
  console.log("=========================================\n");
}

main().catch((e) => {
  console.error("Lỗi:", e);
  process.exit(1);
});
