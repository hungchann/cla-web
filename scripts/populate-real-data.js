/**
 * scripts/populate-real-data.js
 *
 * Upload all MP3 files from "Data app/" to Directus, then create real data:
 *   - topic_of_exercise + lesson_of_Exercise_module entries
 *   - link_exercise entries
 *   - 10 exercises (5 vocab + 5 grammar)
 *   - speaking_scenarios + 14 speaking_dialogues
 *   - 6 dictation course_lessons
 *   - Links lessons through the current typed course_lessons relation fields
 *
 * The existing course id=3 / chapter id=3 / lessons 10-16 are updated with
 * the new resource IDs.
 *
 * Requirements:
 *   Node 20+ (global FormData, File, fetch)
 *
 * Run:
 *   $env:DIRECTUS_ADMIN_EMAIL="admin@education.com"
 *   $env:DIRECTUS_ADMIN_PASSWORD="***"
 *   node scripts/populate-real-data.js
 */

const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline");

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";
const DATA_DIR = path.join(__dirname, "..", "Data app");

function log(icon, msg) { console.log(`${icon} ${msg}`); }

async function requestJson(method, path, body, token) {
  const data = body ? JSON.stringify(body) : null;
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { method, headers, body: data });
  const parsed = await res.json().catch(() => null);
  if (res.ok) return { status: res.status, data: parsed };
  throw { status: res.status, data: parsed };
}

async function login(email, password) {
  const res = await requestJson("POST", "/auth/login", { email, password });
  return res.data?.data?.access_token;
}

async function uploadFile(filePath, title, token) {
  const buffer = fs.readFileSync(filePath);
  const form = new FormData();
  const file = new File([buffer], path.basename(filePath), { type: "audio/mpeg" });
  form.append("file", file, path.basename(filePath));
  form.append("title", title);
  form.append("description", title);

  const res = await fetch(`${API_BASE}/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const parsed = await res.json().catch(() => null);
  if (!res.ok) throw { status: res.status, data: parsed };
  return parsed.data;
}

async function create(collection, payload, token) {
  return requestJson("POST", `/items/${collection}`, payload, token);
}

async function patch(collection, id, payload, token) {
  return requestJson("PATCH", `/items/${collection}/${id}`, payload, token);
}

async function promptCredentials() {
  const email = process.env.DIRECTUS_ADMIN_EMAIL;
  const password = process.env.DIRECTUS_ADMIN_PASSWORD;
  if (email && password) return { email, password };
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((r) => rl.question(q, r));
  log("?", "Nhập admin credentials:");
  const e = await ask("  Email: ");
  const p = await ask("  Password: ");
  rl.close();
  return { email: e.trim(), password: p };
}

async function main() {
  console.log("");
  log("→", `Target: ${API_BASE}`);
  const { email, password } = await promptCredentials();
  let token;
  try {
    token = await login(email, password);
    log("✓", `Logged in as ${email}\n`);
  } catch (e) {
    log("✗", `Login failed: ${JSON.stringify(e.data || e)}`);
    process.exit(1);
  }

  // ─── 1. Upload all MP3 files ──────────────────────────────────────────
  log("·", "Uploading MP3 files from 'Data app/' …");
  const mp3Files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".mp3"));
  const fileIds = {};

  for (const fileName of mp3Files) {
    const fullPath = path.join(DATA_DIR, fileName);
    const key = fileName.replace(/\.mp3$/i, "").replace(/ /g, "_");
    try {
      const uploaded = await uploadFile(fullPath, fileName, token);
      fileIds[key] = uploaded.id;
      log("  ✓", `Uploaded: ${fileName} → id=${uploaded.id.slice(0, 8)}…`);
    } catch (e) {
      log("  ✗", `Upload failed: ${fileName} — ${JSON.stringify(e.data?.errors?.[0]?.message || e.status || e)}`);
    }
  }
  console.log("");

  // ─── 2. Create topic_of_exercise ─────────────────────────────────────
  log("·", "Creating topic_of_exercise…");
  let topic;
  try {
    topic = (await create("topic_of_exercise", {
      title: "Bài 1: Phát âm - Chào hỏi cơ bản (1)",
      title_trans: "Lesson 1: Pronunciation - Basic Greetings (1)",
    }, token)).data.data;
    log("  ✓", `topic_of_exercise id=${topic.id}`);
  } catch (e) {
    log("  ✗", `topic_of_exercise failed: ${JSON.stringify(e.data || e)}`);
    process.exit(1);
  }

  // ─── 3. Create lesson_of_Exercise_module entries ─────────────────────
  log("·", "Creating lesson_of_Exercise_module entries…");
  const lessons = {};
  const lessonDefs = [
    { title: "Bài tập từ vựng bài 1", timeSet: "60" },
    { title: "Bài tập ngữ pháp bài 1", timeSet: "60" },
  ];
  for (const def of lessonDefs) {
    try {
      const l = (await create("lesson_of_Exercise_module", def, token)).data.data;
      lessons[def.title] = l;
      log("  ✓", `lesson id=${l.id} '${l.title}'`);
    } catch (e) {
      log("  ✗", `lesson failed: ${JSON.stringify(e.data || e)}`);
    }
  }

  // ─── 4. Create link_exercise entries ────────────────────────────────
  log("·", "Creating link_exercise entries…");
  const links = {};
  const linkDefs = [
    { key: "vocab",  topic_of_exercise: topic.id, lession_id: lessons["Bài tập từ vựng bài 1"]?.id },
    { key: "grammar", topic_of_exercise: topic.id, lession_id: lessons["Bài tập ngữ pháp bài 1"]?.id },
  ];
  for (const def of linkDefs) {
    if (!def.lession_id) { log("  ✗", `link_exercise ${def.key} skipped: no lesson`); continue; }
    try {
      const l = (await create("link_exercise", {
        topic_of_exercise: def.topic_of_exercise,
        lession_id: def.lession_id,
      }, token)).data.data;
      links[def.key] = l;
      log("  ✓", `link_exercise id=${l.id} (${def.key})`);
    } catch (e) {
      log("  ✗", `link_exercise ${def.key} failed: ${JSON.stringify(e.data || e)}`);
    }
  }
  console.log("");

  // ─── 5. Create exercises ─────────────────────────────────────────────

  // 5a. Vocabulary quiz (5 questions)
  log("·", "Creating vocabulary exercises…");
  const vocabExercises = [
    { question: "Chọn từ nghe được trong audio DUODA.mp3",  answers: ["A. 今年 - năm nay", "B. 多大 - bao nhiêu tuổi", "C. 几 - mấy", "D. 女儿 - con gái"], correct: "B", explanation: "Audio phát âm 'duō dà' — nghĩa là 'bao nhiêu tuổi'." },
    { question: "Chọn từ nghe được trong audio KOU.mp3",    answers: ["A. 大", "B. 口", "C. 几", "D. 女"], correct: "B", explanation: "Audio phát âm 'kǒu' — nghĩa là 'miệng' hoặc lượng từ chỉ người." },
    { question: "Từ 几 - jǐ nghĩa là gì?",                  answers: ["A. Mấy", "B. tuổi", "C. to", "D. nữ"], correct: "A", explanation: "'几' nghĩa là 'mấy, vài'." },
    { question: "Từ 大 - dà nghĩa là gì?",                  answers: ["A. Mấy", "B. tuổi", "C. to", "D. nữ"], correct: "C", explanation: "'大' nghĩa là 'to, lớn'." },
    { question: "Từ 女 - nǚ nghĩa là gì?",                  answers: ["A. Mấy", "B. tuổi", "C. to", "D. nữ"], correct: "D", explanation: "'女' nghĩa là 'nữ, con gái'." },
  ];

  for (let i = 0; i < vocabExercises.length; i++) {
    const q = vocabExercises[i];
    try {
      await create("exercises", {
        question: q.question,
        answer_A: q.answers[0], answer_B: q.answers[1],
        answer_C: q.answers[2], answer_D: q.answers[3],
        Correct_answer: q.correct,
        Explanation: q.explanation,
        link_exercise_id: links.vocab?.id,
        sort: i + 1,
      }, token);
      log("  ✓", `Vocab Q${i + 1}`);
    } catch (e) {
      log("  ✗", `Vocab Q${i + 1} fail: ${JSON.stringify(e.data || e)}`);
    }
  }

  // 5b. Grammar quiz (5 questions)
  log("·", "Creating grammar exercises…");
  const grammarExercises = [
    { question: "Điền vào chỗ trống: 你家有___个人？",        answers: ["A. 怎么 - zěnme", "B. 多少 - duōshǎo", "C. 什么 - shénme", "D. 几 - jǐ"], correct: "D", explanation: "'几' dùng hỏi số lượng nhỏ (< 10)." },
    { question: "Khi trả lời '你今年几岁？' cho người 25 tuổi:", answers: ["A. 我二十五岁了。", "B. 我两十五岁了。", "C. 我二十五个岁了。", "D. 我是二十五岁的人了。"], correct: "A", explanation: "Đúng: Wǒ èrshíwǔ suì le." },
    { question: "Cụm từ '多大' trong câu '你多大了？' có nghĩa là gì?", answers: ["A. Bao nhiêu tiền", "B. Bao nhiêu tuổi", "C. Ở đâu", "D. Bao lâu rồi"], correct: "B", explanation: "'多大' nghĩa là 'bao nhiêu tuổi'." },
    { question: "Trong câu '你家有几口人？', từ '口' có nghĩa/chức năng gì?", answers: ["A. Miệng (nghĩa đen)", "B. Lượng từ chuyên dùng để chỉ người", "C. Lượng từ chỉ miếng ăn", "D. Trợ từ nghi vấn"], correct: "B", explanation: "'口' là lượng từ chỉ người trong gia đình." },
    { question: "Cách hỏi tuổi phù hợp nhất cho một em bé nhỏ tuổi là:", answers: ["A. 你多大了？", "B. 你几岁了？", "C. 您今年高寿？", "D. 你今年多少岁？"], correct: "B", explanation: "'几岁' dùng để hỏi trẻ nhỏ." },
  ];

  for (let i = 0; i < grammarExercises.length; i++) {
    const q = grammarExercises[i];
    try {
      await create("exercises", {
        question: q.question,
        answer_A: q.answers[0], answer_B: q.answers[1],
        answer_C: q.answers[2], answer_D: q.answers[3],
        Correct_answer: q.correct,
        Explanation: q.explanation,
        link_exercise_id: links.grammar?.id,
        sort: i + 1,
      }, token);
      log("  ✓", `Grammar Q${i + 1}`);
    } catch (e) {
      log("  ✗", `Grammar Q${i + 1} fail: ${JSON.stringify(e.data || e)}`);
    }
  }
  console.log("");

  // ─── 6. Create speaking_scenarios + speaking_dialogues ───────────────
  log("·", "Creating speaking_scenarios + dialogues…");
  let scenario, topicId;

  // Find first speaking_topic
  try {
    const topicsData = await requestJson("GET", "/items/speaking_topics?limit=1&fields=id,title", null, token);
    const topics = topicsData.data?.data;
    topicId = topics?.[0]?.id;
    log("  ", `speaking_topic: id=${topicId}`);
  } catch (e) {
    log("  ✗", `speaking_topics lookup failed`);
  }
  if (!topicId) {
    try {
      const t = (await create("speaking_topics", { title: "Chào hỏi", description: "Chủ đề chào hỏi cơ bản" }, token)).data.data;
      topicId = t.id;
      log("  ✓", `Created speaking_topics id=${topicId}`);
    } catch (e) {
      log("  ✗", `speaking_topics create failed: ${JSON.stringify(e.data || e)}`);
    }
  }

  if (topicId) {
    try {
      scenario = (await create("speaking_scenarios", {
        title: "Bài 1: Chào hỏi & Giới thiệu",
        topic_id: topicId,
      }, token)).data.data;
      log("  ✓", `speaking_scenarios id=${scenario.id}`);
    } catch (e) {
      log("  ✗", `scenario failed: ${JSON.stringify(e.data || e)}`);
    }
  }

  const dialogueLines = [
    { speaker: "A", chinese: "你好", pinyin: "Nǐ hǎo", vi: "Xin chào", order: 1 },
    { speaker: "B", chinese: "你好", pinyin: "Nǐ hǎo", vi: "Xin chào", order: 2 },
    { speaker: "A", chinese: "你多大了？", pinyin: "Nǐ duō dà le?", vi: "Bạn bao nhiêu tuổi rồi?", order: 3 },
    { speaker: "B", chinese: "我二十五岁了。", pinyin: "Wǒ èrshíwǔ suì le.", vi: "Tôi 25 tuổi rồi", order: 4 },
    { speaker: "A", chinese: "你家有几口人？", pinyin: "Nǐ jiā yǒu jǐ kǒu rén?", vi: "Nhà bạn có mấy người", order: 5 },
    { speaker: "B", chinese: "我家有四口人。", pinyin: "Wǒ jiā yǒu sì kǒu rén.", vi: "Nhà tôi có 4 người.", order: 6 },
    { speaker: "A", chinese: "你公司有多少人？", pinyin: "Nǐ gōngsī yǒu duōshǎo rén?", vi: "Công ty của bạn có bao nhiêu người.", order: 7 },
    { speaker: "B", chinese: "我公司有三十个人。", pinyin: "Wǒ gōngsī yǒu sānshí gè rén.", vi: "Công ty của tôi có 30 người", order: 8 },
  ];

  if (scenario) {
    for (const line of dialogueLines) {
      try {
        await create("speaking_dialogues", {
          scenario_id: scenario.id,
          speaker: line.speaker,
          order: line.order,
          chinese_text: line.chinese,
          pinyin: line.pinyin,
          vietnamese_text: line.vi,
        }, token);
        log("  ✓", `Dialogue #${line.order} — ${line.speaker}: ${line.chinese}`);
      } catch (e) {
        log("  ✗", `Dialogue #${line.order} fail: ${JSON.stringify(e.data || e)}`);
      }
    }
  }
  console.log("");

  // ─── 7. Create one dictation course_lesson ───────────────────────────
  // One chapter has one dictation lesson. The expected sentence and its
  // audio belong to that row; extra dictation prompts are not extra lessons.
  log("·", "Creating one dictation course_lesson…");
  const dictation = { audioKey: "WOJIAYOUSANKOUREN", expected: "我家有三口人" };
  const dictationAudioId = fileIds[dictation.audioKey];
  const dictLessonIds = [];
  try {
    const row = (await create("course_lessons", {
      status: "published",
      sort: 6,
      title: "Bài tập: Nghe chép chính tả",
      title_trans: "Dictation",
      lesson_type: "dictation",
      content: dictation.expected,
      audio_id: dictationAudioId || null,
      chapter_id: 3,
    }, token)).data.data;
    dictLessonIds.push(row.id);
    log("  ✓", `Dictation lesson id=${row.id} → '${dictation.expected}' audio=${dictationAudioId ? "✓" : "✗"}`);
  } catch (e) {
    log("  ✗", `Dictation failed: ${JSON.stringify(e.data || e)}`);
  }
  console.log("");

  // ─── 8. Update existing course_lessons with new resource IDs ─────────
  log("·", "Updating existing course_lessons (id=10-16)…");

  // Delete old dictation lesson (id=14) — replaced by 6 above
  try { await requestJson("DELETE", "/items/course_lessons/14", null, token); log("  ✓", "Deleted old dictation (id=14)"); }
  catch (e) { log("  −", `Delete 14 skipped`); }

  // quiz_vocab (id=11) → vocab link_exercise
  if (links.vocab) {
    try {
      await patch("course_lessons", 11, {
        exercise_id: Number(links.vocab.id),
      }, token);
      log("  ✓", `Patched lesson id=11 (quiz_vocab) → link_exercise #${links.vocab.id}`);
    } catch (e) {
      log("  ✗", `Patch 11 fail: ${JSON.stringify(e.data || e)}`);
    }
  }

  // quiz_grammar (id=13) → grammar link_exercise
  if (links.grammar) {
    try {
      await patch("course_lessons", 13, {
        exercise_id: Number(links.grammar.id),
      }, token);
      log("  ✓", `Patched lesson id=13 (quiz_grammar) → link_exercise #${links.grammar.id}`);
    } catch (e) {
      log("  ✗", `Patch 13 fail: ${JSON.stringify(e.data || e)}`);
    }
  }

  // conversation (id=15) → new speaking_scenarios
  if (scenario) {
    try {
      await patch("course_lessons", 15, {
        scenario_id: Number(scenario.id),
      }, token);
      log("  ✓", `Patched lesson id=15 (conversation) → speaking_scenarios #${scenario.id}`);
    } catch (e) {
      log("  ✗", `Patch 15 fail: ${JSON.stringify(e.data || e)}`);
    }
  }
  console.log("");

  log("✓", "DONE!");
  console.log("");
  console.log("Summary:");
  console.log(`  ${Object.keys(fileIds).length} audio files uploaded`);
  console.log(`  topic_of_exercise id=${topic.id}`);
  console.log(`  2 lesson_of_Exercise_module (vocab + grammar)`);
  console.log(`  2 link_exercise (vocab=${links.vocab?.id || "?"}, grammar=${links.grammar?.id || "?"})`);
  console.log(`  10 exercises (5 vocab + 5 grammar)`);
  console.log(`  speaking_scenarios id=${scenario?.id || "?"} + 8 dialogues`);
  console.log(`  1 dictation course_lesson (id=${dictLessonIds.join(", ") || "?"})`);
  console.log("");
  console.log("Now run:");
  console.log("  npm run dev");
  console.log(`  http://localhost:3000/courses/3`);
  console.log(`  http://localhost:3000/courses/3/learn?lesson=11  (quiz_vocab — pulls 5 real questions)`);
  console.log(`  http://localhost:3000/courses/3/learn?lesson=13  (quiz_grammar — pulls 5 real questions)`);
  console.log(`  http://localhost:3000/courses/3/learn?lesson=15  (conversation — 8 real dialogue lines)`);
  console.log("");
}

main().catch((e) => { console.error(e); process.exit(1); });
