/**
 * Link a suitable vocab_display_map to every published vocab_theory lesson
 * that is missing one, choosing the map by the course's level:
 *
 *   Sơ cấp      → HSK1 (fallback HSK2)
 *   Trung cấp   → HSK3 (fallback HSK4)
 *   Cao cấp     → HSK5 (fallback HSK6)
 *   (unmatched  → the largest non-empty map)
 *
 * Skips lessons that already have a vocab_display_map_id, so it is safe to
 * re-run whenever new courses/chapters are added.
 *
 * Run:
 *   $env:DIRECTUS_ADMIN_EMAIL="admin@education.com"
 *   $env:DIRECTUS_ADMIN_PASSWORD="***"
 *   node scripts/link-vocab-theory.js
 */

const https = require("node:https");
const readline = require("node:readline");

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";

const LEVEL_HSK_PREFERENCE = {
  "sơ cấp": ["HSK1", "HSK2"],
  "trung cấp": ["HSK3", "HSK4"],
  "cao cấp": ["HSK5", "HSK6"],
};

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

async function loadMapsByLevel(token) {
  const candidates = await request("GET", "/items/vocab_display_map?fields=id,level_id,level_id.name&limit=-1", null, token);
  const maps = candidates?.data || [];
  const levelMap = new Map();
  for (const map of maps) {
    const agg = await request("GET", `/items/vocab_display_map_vocab_items?filter[vocab_display_map_id][_eq]=${map.id}&aggregate[count]=id&limit=1`, null, token);
    const count = agg?.data?.[0]?.count?.id || 0;
    if (count === 0) continue;
    const levelName = (map.level_id?.name || "").toUpperCase();
    if (!levelMap.has(levelName)) levelMap.set(levelName, []);
    levelMap.get(levelName).push({ id: map.id, levelName, itemCount: count });
  }
  for (const list of levelMap.values()) list.sort((a, b) => b.itemCount - a.itemCount);
  return levelMap;
}

function pickForCourse(courseLevel, levelMap) {
  const normalized = (courseLevel || "").trim().toLowerCase();
  const preference = LEVEL_HSK_PREFERENCE[normalized] || [];
  for (const hsk of preference) {
    const list = levelMap.get(hsk) || levelMap.get(hsk.replace(/HSK/, "HSK")) || [];
    if (list.length) return list[0];
  }
  let fallback = null;
  for (const list of levelMap.values()) {
    for (const map of list) {
      if (!fallback || map.itemCount > fallback.itemCount) fallback = map;
    }
  }
  return fallback;
}

async function main() {
  const { email, password } = await getCredentials();
  const auth = await request("POST", "/auth/login", { email, password });
  const token = auth?.data?.access_token;
  if (!token) throw new Error("Directus did not return an access token");

  const levelMap = await loadMapsByLevel(token);
  if (levelMap.size === 0) {
    console.log("No vocab_display_map with items found.");
    process.exitCode = 1;
    return;
  }

  // Map chapter -> its course level.
  const courses = (await request("GET", "/items/course?filter[status][_eq]=published&fields=id,title,level", null, token))?.data || [];
  const chapterLevel = new Map();
  for (const course of courses) {
    const chapters = (await request("GET", `/items/course_chapters?filter[course_id][_eq]=${course.id}&fields=id`, null, token))?.data || [];
    for (const chapter of chapters) chapterLevel.set(String(chapter.id), course.level);
  }

  const lessons = await request("GET", "/items/course_lessons?filter[lesson_type][_eq]=vocab_theory&filter[status][_eq]=published&fields=id,title,chapter_id,vocab_display_map_id", null, token);
  let patched = 0;
  let skipped = 0;
  for (const lesson of lessons?.data || []) {
    const courseLevel = chapterLevel.get(String(lesson.chapter_id));
    const pick = pickForCourse(courseLevel, levelMap);
    if (!pick) {
      console.log(`  no map available → lesson ${lesson.id} (${lesson.title})`);
      continue;
    }
    const currentMapId = typeof lesson.vocab_display_map_id === "object"
      ? lesson.vocab_display_map_id?.id
      : lesson.vocab_display_map_id;
    if (String(currentMapId || "") === String(pick.id)) {
      skipped++;
      continue;
    }
    await request("PATCH", `/items/course_lessons/${lesson.id}`, { vocab_display_map_id: pick.id }, token);
    console.log(`  linked vocab_display_map #${pick.id} (${pick.levelName}, ${pick.itemCount}) → lesson ${lesson.id} (${lesson.title})`);
    patched++;
  }
  console.log(patched ? `Done. ${patched} lesson(s) linked, ${skipped} already linked.` : `No lesson needed linking (${skipped} already linked).`);
}

main().catch((error) => {
  console.error("Failed:", error.data || error.message || error);
  process.exitCode = 1;
});
