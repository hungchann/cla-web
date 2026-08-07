/**
 * scripts/fix-missing-resources.js
 *
 * Quick fix: delete duplicate course id=2, patch video_vocab/video_grammar lessons
 * with real video_section IDs.
 *
 * Run:
 *   $env:DIRECTUS_ADMIN_EMAIL="admin@education.com"
 *   $env:DIRECTUS_ADMIN_PASSWORD="***"
 *   node scripts/fix-missing-resources.js
 */

const https = require("https");
const { URL } = require("url");
const readline = require("readline");

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";

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
  console.log("? Nhập admin credentials:");
  const e = await ask("  Email: ");
  const p = await ask("  Password: ");
  rl.close();
  return { email: e.trim(), password: p };
}

async function login(email, password) {
  const res = await request("POST", "/auth/login", { email, password });
  return res.data?.data?.access_token;
}

async function del(collection, id, token) {
  return request("DELETE", `/items/${collection}/${id}`, null, token);
}

async function patch(collection, id, payload, token) {
  return request("PATCH", `/items/${collection}/${id}`, payload, token);
}

async function listFirst(collection, filter, fields, token) {
  let path = `/items/${collection}?limit=1&fields=${fields}`;
  if (filter) path += `&filter=${encodeURIComponent(JSON.stringify(filter))}`;
  const res = await request("GET", path, null, token);
  return (res.data?.data || [])[0] || null;
}

async function main() {
  console.log("");
  const { email, password } = await promptCredentials();
  let token;
  try {
    token = await login(email, password);
    console.log(`✓ Logged in as ${email}\n`);
  } catch (e) {
    console.log(`✗ Login failed: ${JSON.stringify(e.data || e)}`);
    process.exit(1);
  }

  // Delete old duplicate course id=2
  console.log("· Deleting old duplicate course id=2…");
  try {
    await del("course", 2, token);
    console.log("  ✓ Deleted course id=2 (cascading chapters + lessons)");
  } catch (e) {
    console.log(`  − Delete skipped or already deleted: ${e.status}`);
  }
  console.log("");

  // Find first video_section with a video file
  console.log("· Finding video_section with video_file…");
  let vs = await listFirst("video_section", { video_file: { _nnull: true } }, "id,title", token);
  if (!vs) {
    vs = await listFirst("video_section", null, "id,title", token);
  }
  if (vs) {
    console.log(`  ✓ Found video_section id=${vs.id} title='${vs.title}'`);

    // Patch video_vocab (id=10) and video_grammar (id=12)
    for (const [lessonId, lessonType] of [[10, "video_vocab"], [12, "video_grammar"]]) {
      try {
        await patch("course_lessons", lessonId, {
          resource_id: vs.id,
          resource_collection: "video_section",
        }, token);
        console.log(`  ✓ Patched lesson id=${lessonId} (${lessonType}) → video_section #${vs.id}`);
      } catch (e) {
        console.log(`  ✗ Patch lesson id=${lessonId} failed: ${JSON.stringify(e.data || e)}`);
      }
    }
  } else {
    console.log("  ⚠ No video_section found. Upload a video in Admin UI first.");
  }

  // Find an audio file for dictation
  console.log("");
  console.log("· Finding any directus_files for dictation audio…");
  try {
    const files = await listFirst("directus_files", null, "id,title,type", token);
    if (files) {
      await patch("course_lessons", 14, {
        resource_id: files.id,
        resource_collection: "directus_files",
      }, token);
      console.log(`  ✓ Patched dictation (id=14) → directus_files #${files.id}`);
    } else {
      console.log("  − No files found; dictation uses speechSynthesis fallback.");
    }
  } catch (e) {
    console.log(`  − directus_files lookup skipped (FORBIDDEN). Dictation uses speechSynthesis.`);
  }

  console.log("");
  console.log("✓ Fix complete.");
  console.log("");
  console.log("Test:");
  console.log("  npm run dev");
  console.log("  http://localhost:3000/courses");
  console.log("  http://localhost:3000/courses/3");
  console.log("  http://localhost:3000/courses/3/learn?lesson=10  (video_vocab)");
  console.log("  http://localhost:3000/courses/3/learn?lesson=11  (quiz_vocab)");
  console.log("  http://localhost:3000/courses/3/learn?lesson=15  (conversation)");
  console.log("");
}

main().catch((e) => { console.error(e); process.exit(1); });
