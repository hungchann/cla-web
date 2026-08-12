/**
 * scripts/seed-course-sample.js
 *
 * Seed sample data for the `course` family AND auto-link resources.
 *
 * What it does:
 *   1. Login as admin (env DIRECTUS_ADMIN_EMAIL / DIRECTUS_ADMIN_PASSWORD).
 *   2. Insert 1 `course` + 1 `course_chapters` + 8 `course_lessons`.
 *   3. For each lesson_type, lookup an existing resource on Directus
 *      (video_section, link_exercise, speaking_scenarios, directus_files)
 *      and PATCH the lesson row with its typed relation field.
 *   4. For `dictation`: create exactly one lesson and set content = "你好".
 *   5. For `extra`: leave file fields empty (mandatory upload manually).
 *
 * Run:
 *   $env:DIRECTUS_ADMIN_EMAIL="admin@education.com"
 *   $env:DIRECTUS_ADMIN_PASSWORD="***"
 *   node scripts/seed-course-sample.js
 */

const https = require("https");
const { URL } = require("url");
const readline = require("readline");

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";

const SAMPLE_COURSE = {
  status: "published",
  sort: 1,
  title: "Giao tiếp Tiếng Trung đời sống cho người mới bắt đầu (Giản thể)",
  title_trans: "Daily Life Chinese Communication (Simplified)",
  description: "Dành cho người mới bắt đầu học Tiếng Trung hoặc học nhưng bị mất gốc. Muốn học giao tiếp Tiếng Trung để đi du lịch, công tác nhưng không có nhiều thời gian lên lớp học.",
  script_type: "simplified",
  level: "Sơ cấp",
  duration: "2 - 3 tháng",
  is_featured: true,
  isBilingual: false,
  subtext: null,
};

const SAMPLE_CHAPTER = {
  status: "published",
  sort: 1,
  title: "Bài 1: Phát âm - Chào hỏi cơ bản (1)",
  title_trans: "Lesson 1: Pronunciation - Basic Greetings (1)",
  tag: "Học thử miễn phí",
  description: "Bài đầu tiên trong khóa — làm quen với phát âm và chào hỏi cơ bản.",
};

const SAMPLE_LESSONS = [
  { lesson_type: "video_vocab",   title: "Video từ vựng",                sort: 1 },
  { lesson_type: "vocab_theory",  title: "Lý thuyết: Giải nghĩa từ vựng", sort: 2 },
  { lesson_type: "quiz_vocab",    title: "Bài tập: từ vựng",             sort: 3 },
  { lesson_type: "video_grammar", title: "Video ngữ pháp",               sort: 4 },
  { lesson_type: "quiz_grammar",  title: "Bài tập ngữ pháp",             sort: 5 },
  { lesson_type: "dictation",     title: "Bài tập: Nghe chép chính tả",   sort: 6, content: "你好" },
  { lesson_type: "conversation",  title: "Thực hành hội thoại",          sort: 7 },
  { lesson_type: "extra",         title: "Bài tập bổ sung",              sort: 8 },
];

function log(icon, msg) { console.log(`${icon} ${msg}`); }

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
        res.on("data", (c) => (buf += c));
        res.on("end", () => {
          let parsed = null;
          try { parsed = buf ? JSON.parse(buf) : null; } catch (e) { parsed = buf; }
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
  const ask = (q) => new Promise((r) => rl.question(q, r));
  log("?", "Env not set. Nhập admin credentials:");
  const e = await ask("  Email: ");
  const p = await ask("  Password: ");
  rl.close();
  return { email: e.trim(), password: p };
}

async function login(email, password) {
  const res = await request("POST", "/auth/login", { email, password });
  return res.data?.data?.access_token;
}

async function create(collection, payload, token) {
  const res = await request("POST", `/items/${collection}`, payload, token);
  return res.data?.data;
}

async function patch(collection, id, payload, token) {
  const res = await request("PATCH", `/items/${collection}/${id}`, payload, token);
  return res.data?.data;
}

async function listItems(collection, params, token) {
  let path = `/items/${collection}?limit=1`;
  if (params?.filter) path += `&filter=${encodeURIComponent(JSON.stringify(params.filter))}`;
  if (params?.fields) path += `&fields=${params.fields}`;
  const res = await request("GET", path, null, token);
  return res.data?.data || [];
}

async function main() {
  console.log("");
  log("→", `Target: ${API_BASE}`);
  const { email, password } = await promptCredentials();
  let token;
  try {
    token = await login(email, password);
    log("✓", `Logged in as ${email}`);
  } catch (e) {
    log("✗", `Login failed: ${JSON.stringify(e.data || e)}`);
    process.exit(1);
  }
  console.log("");

  // Step 1: Lookup resources first
  log("·", "Looking up existing resources…");
  let videoSection = null;
  let linkExercise = null;
  let speakingScenario = null;
  let audioFile = null;
  let vocabDisplayMap = null;

  try {
    let videos = await listItems("video_section", {
      filter: { video_file: { _nnull: true } },
      fields: "id,title",
    }, token);
    if (!videos.length) {
      videos = await listItems("video_section", { fields: "id,title" }, token);
    }
    videoSection = videos[0];
    log("  ", `video_section: ${videoSection ? `id=${videoSection.id} title='${videoSection.title}'` : "NONE FOUND"}`);
  } catch (e) { log("  !", `video_section lookup failed: ${JSON.stringify(e.data || e)}`); }

  try {
    const links = await listItems("link_exercise", { filter: {}, fields: "id,lession_id.title" }, token);
    linkExercise = links[0];
    log("  ", `link_exercise: ${linkExercise ? `id=${linkExercise.id}` : "NONE FOUND"}`);
  } catch (e) { log("  !", `link_exercise lookup failed: ${JSON.stringify(e.data || e)}`); }

  try {
    const scenarios = await listItems("speaking_scenarios", { filter: {}, fields: "id,title" }, token);
    speakingScenario = scenarios[0];
    log("  ", `speaking_scenarios: ${speakingScenario ? `id=${speakingScenario.id} title='${speakingScenario.title}'` : "NONE FOUND"}`);
  } catch (e) { log("  !", `speaking_scenarios lookup failed: ${JSON.stringify(e.data || e)}`); }

  try {
    const files = await listItems("directus_files", { fields: "id,title,type" }, token);
    audioFile = files[0];
    log("  ", `directus_files: ${audioFile ? `id=${audioFile.id} title='${audioFile.title}'` : "NONE FOUND"}`);
  } catch (e) { log("  !", `directus_files lookup failed: ${JSON.stringify(e.data || e)}`); }

  try {
    const maps = await listItems("vocab_display_map", { filter: {}, fields: "id,topic_id.name" }, token);
    vocabDisplayMap = maps[0];
    log("  ", `vocab_display_map: ${vocabDisplayMap ? `id=${vocabDisplayMap.id}` : "NONE FOUND"}`);
  } catch (e) { log("  !", `vocab_display_map lookup failed: ${JSON.stringify(e.data || e)}`); }

  console.log("");

  // Step 2: Insert course
  log("·", "Inserting sample course…");
  let course;
  try {
    course = await create("course", SAMPLE_COURSE, token);
    log("  ✓", `course id=${course.id} title='${course.title}'`);
  } catch (e) {
    log("  ✗", `course insert failed: ${JSON.stringify(e.data || e)}`);
    process.exit(1);
  }

  // Step 3: Insert chapter
  log("·", "Inserting sample chapter…");
  let chapter;
  try {
    chapter = await create("course_chapters", { ...SAMPLE_CHAPTER, course_id: course.id }, token);
    log("  ✓", `course_chapter id=${chapter.id} title='${chapter.title}'`);
  } catch (e) {
    log("  ✗", `course_chapter insert failed: ${JSON.stringify(e.data || e)}`);
    process.exit(1);
  }

  // Step 4: Insert lessons and auto-link resources
  log("·", "Inserting 8 lessons + auto-linking resources…");
  for (const l of SAMPLE_LESSONS) {
    let row;
    try {
      row = await create("course_lessons", {
        lesson_type: l.lesson_type,
        title: l.title,
        sort: l.sort,
        status: "published",
        chapter_id: chapter.id,
        content: l.content || null,
      }, token);
      log("  ✓", `lesson id=${row.id} type='${l.lesson_type}' created`);
    } catch (e) {
      log("  ✗", `lesson ${l.lesson_type} insert failed: ${JSON.stringify(e.data || e)}`);
      continue;
    }

    // Auto-link resource
    try {
      switch (l.lesson_type) {
        case "video_vocab":
        case "video_grammar":
          if (videoSection) {
            await patch("course_lessons", row.id, {
              video_section_id: videoSection.id,
            }, token);
            log("  ⬈", `  linked → video_section #${videoSection.id}`);
          } else {
            log("  ⚠", `  no video_section available; set manually`);
          }
          break;

        case "vocab_theory":
          if (vocabDisplayMap) {
            await patch("course_lessons", row.id, {
              vocab_display_map_id: vocabDisplayMap.id,
            }, token);
            log("  ⬈", `  linked → vocab_display_map #${vocabDisplayMap.id}`);
          } else {
            log("  ⚠", `  no vocab_display_map available; set manually`);
          }
          break;

        case "quiz_vocab":
        case "quiz_grammar":
          if (linkExercise) {
            await patch("course_lessons", row.id, {
              exercise_id: Number(linkExercise.id),
            }, token);
            log("  ⬈", `  linked → link_exercise #${linkExercise.id}`);
          } else {
            log("  ⚠", `  no link_exercise available; set manually`);
          }
          break;

        case "dictation":
          if (audioFile) {
            await patch("course_lessons", row.id, {
              audio_id: audioFile.id,
            }, token);
            log("  ⬈", `  linked → directus_files #${audioFile.id} (audio)`);
          } else {
            log("  ⬈", `  no audio file found; dictation uses speechSynthesis fallback`);
          }
          break;

        case "conversation":
          if (speakingScenario) {
            await patch("course_lessons", row.id, {
              scenario_id: Number(speakingScenario.id),
            }, token);
            log("  ⬈", `  linked → speaking_scenarios #${speakingScenario.id}`);
          } else {
            log("  ⚠", `  no speaking_scenarios available; set manually`);
          }
          break;

        case "extra":
          log("  ⚠", `  extra files (pdf/answer/audio) must be uploaded manually via Admin UI`);
          break;

        default:
          break;
      }
    } catch (e) {
      log("  ⚠", `  link failed: ${JSON.stringify(e.data || e)}`);
    }
  }

  console.log("");
  log("✓", "Seed complete.");
  console.log("");
  console.log("Summary:");
  console.log(`  course          id=${course.id}`);
  console.log(`  course_chapter  id=${chapter.id} (course_id=${course.id})`);
  console.log(`  8 course_lessons (chapter_id=${chapter.id}) — one lesson per guide type`);
  console.log("");
  if (!videoSection) console.log("  ⚠ video_section: NOT FOUND — set video_section_id manually for video_vocab & video_grammar.");
  if (!linkExercise) console.log("  ⚠ link_exercise: NOT FOUND — set exercise_id manually for quiz_vocab & quiz_grammar.");
  if (!speakingScenario) console.log("  ⚠ speaking_scenarios: NOT FOUND — set scenario_id manually for conversation.");
  if (!audioFile) console.log("  ⚠ directus_files (audio): NOT FOUND — no audio for dictation; speechSynthesis will be used as fallback.");
  console.log("");
  console.log("Now run `npm run dev` and test:");
  console.log("  http://localhost:3000/courses");
  console.log(`  http://localhost:3000/courses/${course.id}`);
  console.log(`  http://localhost:3000/courses/${course.id}/learn?lesson=<any-lesson-id>`);
  console.log("");
}

main().catch((e) => { console.error("Unhandled error:", e); process.exit(1); });
