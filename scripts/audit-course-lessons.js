/**
 * scripts/audit-course-lessons.js
 *
 * Fetch all course_lessons for chapter_id=3 and print them for audit.
 * No writes — read-only.
 *
 * Run:
 *   node scripts/audit-course-lessons.js
 */

const https = require("node:https");
const readline = require("node:readline");
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const data = body ? JSON.stringify(body) : null;
    const headers = { "Content-Type": "application/json", Accept: "application/json" };
    if (data) headers["Content-Length"] = Buffer.byteLength(data);
    if (token) headers.Authorization = `Bearer ${token}`;
    const req = https.request({ hostname: url.hostname, port: 443, path: url.pathname + url.search, method, headers }, (res) => {
      let b = "";
      res.on("data", (c) => (b += c));
      res.on("end", () => {
        try { b = JSON.parse(b); } catch (e) {}
        if (res.statusCode < 300) resolve({ status: res.statusCode, data: b });
        else reject({ status: res.statusCode, data: b });
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function login() {
  const e = process.env.DIRECTUS_ADMIN_EMAIL;
  const p = process.env.DIRECTUS_ADMIN_PASSWORD;
  if (e && p) { const r = await request("POST", "/auth/login", { email: e, password: p }); return r.data?.data?.access_token; }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const email = await new Promise((r) => rl.question("  Email: ", r));
  const pass = await new Promise((r) => rl.question("  Password: ", r));
  rl.close();
  const r = await request("POST", "/auth/login", { email: email.trim(), password: pass });
  return r.data?.data?.access_token;
}

async function main() {
  const token = await login();
  console.log("✓ Logged in\n");

  // Fetch course #3
  const courseRes = await request("GET", "/items/course/3?fields=id,title,description,level,script_type,duration,image.id,image.filename_disk", null, token);
  const course = courseRes.data?.data;
  console.log("=== COURSE ===");
  console.log(`  id=${course?.id} title='${course?.title}'`);
  console.log(`  level=${course?.level} script_type=${course?.script_type} duration=${course?.duration}`);
  console.log(`  image: ${course?.image?.id ? course.image.id.slice(0, 8) + "..." : "NONE"}`);
  console.log("");

  // Fetch chapters for course #3
  const chaptersRes = await request("GET", "/items/course_chapters?filter[course_id][_eq]=3&sort=sort&fields=id,sort,title,status", null, token);
  const chapters = chaptersRes.data?.data || [];
  console.log(`=== CHAPTERS (${chapters.length}) ===`);
  for (const ch of chapters) {
    console.log(`  id=${ch.id} sort=${ch.sort} status=${ch.status} title='${ch.title}'`);
  }
  console.log("");

  // Fetch ALL lessons for all chapters
  const allChapterIds = chapters.map(c => c.id);
  const lessonsRes = await request("GET", `/items/course_lessons?filter[chapter_id][_in]=${allChapterIds.join(",")}&sort=sort&fields=id,sort,title,lesson_type,status,video_section_id,vocab_display_map_id,exercise_id,scenario_id,audio_id,content,chapter_id`, null, token);
  const lessons = lessonsRes.data?.data || [];

  console.log(`=== LESSONS (${lessons.length}) ===`);
  const UI_EXPECTED = ["video_vocab", "vocab_theory", "quiz_vocab", "video_grammar", "quiz_grammar", "dictation", "conversation", "extra"];

  for (const l of lessons) {
    const inUI = UI_EXPECTED.includes(l.lesson_type) ? "✓" : "✗ UNKNOWN TYPE";
    const target = l.video_section_id ? `video_section #${l.video_section_id}` : l.vocab_display_map_id ? `vocab_display_map #${l.vocab_display_map_id}` : l.exercise_id ? `link_exercise #${l.exercise_id}` : l.scenario_id ? `scenario #${l.scenario_id}` : l.audio_id ? `audio #${l.audio_id}` : "NO FK";
    console.log(`  ${inUI} id=${l.id} sort=${l.sort} type='${l.lesson_type}' chapter=${l.chapter_id} | relation: ${target}`);
    if (l.content) console.log(`       content: '${l.content}'`);
  }
  console.log("");

  // Check: does each expected type appear exactly once?
  const typeCount = {};
  for (const l of lessons) typeCount[l.lesson_type] = (typeCount[l.lesson_type] || 0) + 1;
  console.log("=== TYPE COUNTS ===");
  for (const t of UI_EXPECTED) {
    const c = typeCount[t] || 0;
    console.log(`  ${c === 1 ? "✓" : c === 0 ? "✗ MISSING" : "⚠ DUPLICATE (" + c + ")"} ${t}`);
  }
  console.log("");

  // Check FK relations for each lesson type
  console.log("=== RELATION CHECK ===");
  for (const l of lessons) {
    let hasFK = true;
    if (["video_vocab", "video_grammar"].includes(l.lesson_type)) hasFK = !!l.video_section_id;
    if (l.lesson_type === "vocab_theory") hasFK = !!l.vocab_display_map_id;
    if (["quiz_vocab", "quiz_grammar"].includes(l.lesson_type)) hasFK = !!l.exercise_id;
    if (l.lesson_type === "conversation") hasFK = !!l.scenario_id;
    if (l.lesson_type === "dictation") hasFK = !!l.content || !!l.audio_id;

    if (!hasFK) {
      console.log(`  ✗ id=${l.id} type='${l.lesson_type}': missing FK relation`);
    } else {
      console.log(`  ✓ id=${l.id} type='${l.lesson_type}': OK`);
    }
  }
  console.log("\nAll looks OK? Try /courses/3 in browser.");
}

main().catch((e) => { console.error(e); process.exit(1); });
