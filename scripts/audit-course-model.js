/**
 * Read-only audit for the course model described in
 * docs/HUONG_DAN_NHAP_LIEU_COURSE_DIRECTUS.md.
 *
 * It checks every published course/chapter for exactly one lesson of each
 * canonical type and validates the typed relation required by that type.
 *
 * Run with DIRECTUS_ADMIN_EMAIL / DIRECTUS_ADMIN_PASSWORD set, or enter them
 * interactively when prompted.
 */

const https = require("node:https");
const readline = require("node:readline");

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";
const EXPECTED_TYPES = [
  "video_vocab",
  "vocab_theory",
  "quiz_vocab",
  "video_grammar",
  "quiz_grammar",
  "dictation",
  "conversation",
  "extra",
];

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const data = body ? JSON.stringify(body) : null;
    const headers = { Accept: "application/json" };
    if (data) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = Buffer.byteLength(data);
    }
    if (token) headers.Authorization = `Bearer ${token}`;

    const req = https.request({ hostname: url.hostname, port: url.port || 443, path: url.pathname + url.search, method, headers }, (res) => {
      let text = "";
      res.on("data", (chunk) => (text += chunk));
      res.on("end", () => {
        let parsed = text;
        try { parsed = text ? JSON.parse(text) : null; } catch {}
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
        else reject({ status: res.statusCode, data: parsed });
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function credentials() {
  if (process.env.DIRECTUS_ADMIN_EMAIL && process.env.DIRECTUS_ADMIN_PASSWORD) {
    return { email: process.env.DIRECTUS_ADMIN_EMAIL, password: process.env.DIRECTUS_ADMIN_PASSWORD };
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (text) => new Promise((resolve) => rl.question(text, resolve));
  const email = await ask("Email: ");
  const password = await ask("Password: ");
  rl.close();
  return { email: email.trim(), password };
}

function relationStatus(lesson) {
  switch (lesson.lesson_type) {
    case "video_vocab":
    case "video_grammar":
      return Boolean(lesson.video_section_id);
    case "vocab_theory":
      return Boolean(lesson.vocab_display_map_id);
    case "quiz_vocab":
    case "quiz_grammar":
      return Boolean(lesson.exercise_id);
    case "dictation":
      return Boolean(lesson.content) || Boolean(lesson.audio_id);
    case "conversation":
      return Boolean(lesson.scenario_id);
    case "extra":
      return Boolean(lesson.extra_pdf_id || lesson.extra_answer_id || lesson.extra_audio_id);
    default:
      return false;
  }
}

async function main() {
  const { email, password } = await credentials();
  const auth = await request("POST", "/auth/login", { email, password });
  const token = auth?.data?.access_token;
  if (!token) throw new Error("Directus did not return an access token");

  const courses = (await request("GET", "/items/course?filter[status][_eq]=published&fields=id,title", null, token))?.data || [];
  let failures = 0;

  for (const course of courses) {
    const chapters = (await request("GET", `/items/course_chapters?filter[course_id][_eq]=${course.id}&filter[status][_eq]=published&sort=sort&fields=id,title,sort`, null, token))?.data || [];
    console.log(`\n${course.id}: ${course.title} (${chapters.length} chapter(s))`);
    for (const chapter of chapters) {
      const FULL_FIELDS = "id,title,sort,lesson_type,video_section_id,vocab_display_map_id,exercise_id,audio_id,content,scenario_id,extra_pdf_id,extra_answer_id,extra_audio_id";
      const BASE_FIELDS = "id,title,sort,lesson_type,video_section_id,exercise_id,audio_id,content,scenario_id,extra_pdf_id,extra_answer_id,extra_audio_id";
      let lessons;
      try {
        lessons = (await request("GET", `/items/course_lessons?filter[chapter_id][_eq]=${chapter.id}&filter[status][_eq]=published&sort=sort&fields=${FULL_FIELDS}`, null, token))?.data || [];
      } catch (error) {
        if (JSON.stringify(error.data || error).includes("vocab_display_map_id")) {
          console.log(`    note: field vocab_display_map_id does not exist yet; vocab_theory relation cannot be checked`);
          lessons = (await request("GET", `/items/course_lessons?filter[chapter_id][_eq]=${chapter.id}&filter[status][_eq]=published&sort=sort&fields=${BASE_FIELDS}`, null, token))?.data || [];
        } else {
          throw error;
        }
      }
      const counts = Object.fromEntries(EXPECTED_TYPES.map((type) => [type, 0]));
      for (const lesson of lessons) counts[lesson.lesson_type] = (counts[lesson.lesson_type] || 0) + 1;
      const missing = EXPECTED_TYPES.filter((type) => counts[type] !== 1);
      const unknown = lessons.filter((lesson) => !EXPECTED_TYPES.includes(lesson.lesson_type));
      const badRelations = lessons.filter((lesson) => EXPECTED_TYPES.includes(lesson.lesson_type) && !relationStatus(lesson));
      const ok = missing.length === 0 && unknown.length === 0 && badRelations.length === 0;
      console.log(`  ${ok ? "OK" : "FAIL"} chapter ${chapter.id} ${chapter.title}: ${lessons.length} lesson(s)`);
      if (missing.length) console.log(`    missing/duplicate: ${missing.map((type) => `${type}(${counts[type] || 0})`).join(", ")}`);
      if (unknown.length) console.log(`    unknown types: ${unknown.map((lesson) => `${lesson.id}:${lesson.lesson_type}`).join(", ")}`);
      if (badRelations.length) console.log(`    missing typed relation: ${badRelations.map((lesson) => `${lesson.id}:${lesson.lesson_type}`).join(", ")}`);
      if (!ok) failures++;
    }
  }

  console.log(`\nAudit ${failures ? "FAILED" : "PASSED"}: ${failures} invalid chapter(s).`);
  process.exitCode = failures ? 1 : 0;
}

main().catch((error) => {
  console.error("Audit failed:", error.data || error.message || error);
  process.exitCode = 1;
});
