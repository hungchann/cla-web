/**
 * Normalize published lessons to the 8-type model in the course guide.
 *
 * Default behavior removes duplicate lesson rows (keeping the lowest sort/id)
 * and renumbers the survivors. Pass --create-missing to add empty published
 * lesson rows for missing types; content/resources still need to be filled in
 * through Directus.
 *
 * Flags:
 *   --create-missing   create shell lesson rows for missing types
 *   --delete-unknown   remove lessons whose type is not in the guide
 *   --delete-orphans   remove published lessons with chapter_id = null
 */

const https = require("node:https");
const readline = require("node:readline");

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";
const CREATE_MISSING = process.argv.includes("--create-missing");
const DELETE_UNKNOWN = process.argv.includes("--delete-unknown");
const DELETE_ORPHANS = process.argv.includes("--delete-orphans");
const LESSONS = [
  ["video_vocab", "Video từ vựng"],
  ["vocab_theory", "Lý thuyết: Giải nghĩa từ vựng"],
  ["quiz_vocab", "Bài tập: từ vựng"],
  ["video_grammar", "Video ngữ pháp"],
  ["quiz_grammar", "Bài tập ngữ pháp"],
  ["dictation", "Bài tập: Nghe chép chính tả"],
  ["conversation", "Thực hành hội thoại"],
  ["extra", "Bài tập bổ sung"],
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

async function getCredentials() {
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

async function main() {
  const { email, password } = await getCredentials();
  const auth = await request("POST", "/auth/login", { email, password });
  const token = auth?.data?.access_token;
  if (!token) throw new Error("Directus did not return an access token");

  const chapters = (await request("GET", "/items/course_chapters?filter[status][_eq]=published&sort=course_id,sort&fields=id,course_id,title", null, token))?.data || [];

  if (DELETE_ORPHANS) {
    const orphans = (await request("GET", "/items/course_lessons?filter[chapter_id][_null]=true&fields=id,title,lesson_type,status", null, token))?.data || [];
    for (const orphan of orphans) {
      await request("DELETE", `/items/course_lessons/${orphan.id}`, null, token);
      console.log(`deleted orphan lesson ${orphan.id} (${orphan.lesson_type}) chapter_id=null`);
    }
  }

  for (const chapter of chapters) {
    const lessons = (await request("GET", `/items/course_lessons?filter[chapter_id][_eq]=${chapter.id}&filter[status][_eq]=published&sort=sort,id&fields=id,lesson_type,title,sort`, null, token))?.data || [];
    const byType = new Map();
    for (const lesson of lessons) {
      if (!LESSONS.some(([type]) => type === lesson.lesson_type)) {
        if (DELETE_UNKNOWN) {
          await request("DELETE", `/items/course_lessons/${lesson.id}`, null, token);
          console.log(`deleted unknown lesson ${lesson.id} (${lesson.lesson_type}) in chapter ${chapter.id}`);
        } else {
          console.log(`unknown lesson ${lesson.id} (${lesson.lesson_type}) in chapter ${chapter.id} (use --delete-unknown to remove)`);
        }
        continue;
      }
      if (!byType.has(lesson.lesson_type)) byType.set(lesson.lesson_type, []);
      byType.get(lesson.lesson_type).push(lesson);
    }

    let sort = 1;
    for (const [type, title] of LESSONS) {
      const rows = byType.get(type) || [];
      const keep = rows[0];
      for (const duplicate of rows.slice(1)) {
        await request("DELETE", `/items/course_lessons/${duplicate.id}`, null, token);
        console.log(`deleted duplicate lesson ${duplicate.id} (${type}) in chapter ${chapter.id}`);
      }
      if (keep) {
        await request("PATCH", `/items/course_lessons/${keep.id}`, { sort, title }, token);
      } else if (CREATE_MISSING) {
        await request("POST", "/items/course_lessons", { chapter_id: chapter.id, status: "published", sort, lesson_type: type, title }, token);
        console.log(`created missing lesson ${type} in chapter ${chapter.id}`);
      } else {
        console.log(`missing ${type} in chapter ${chapter.id} (use --create-missing to add shell)`);
      }
      sort += 1;
    }
  }
}

main().catch((error) => {
  console.error("Normalization failed:", error.data || error.message || error);
  process.exitCode = 1;
});
