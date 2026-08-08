/**
 * scripts/verify-course-relations.js
 *
 * Check that O2M aliases exist for GraphQL queries.
 * Prints which fields are available and which are missing.
 *
 * Run:
 *   node scripts/verify-course-relations.js
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
    const req = https.request({ hostname: url.hostname, port: 443, path: url.pathname, method, headers }, (res) => {
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

  // Check all relations for course* collections
  const all = (await request("GET", "/relations", null, token)).data?.data || [];
  const courseRels = all.filter((r) => ["course", "course_chapters", "course_lessons"].includes(r.collection));

  console.log("\n─ Relations ─");
  for (const r of courseRels) {
    console.log(`  ${r.collection}.${r.field} → ${r.related_collection || "(M2A)"}`);
    if (r.meta?.one_allowed_collections) {
      console.log(`    M2A whitelist: ${r.meta.one_allowed_collections.join(", ")}`);
    }
    if (r.meta?.one_collection_field) {
      console.log(`    discriminator: ${r.meta.one_collection_field}`);
    }
  }

  // Test GraphQL: can we query chapters on course?
  console.log("\n─ GraphQL test ─");
  try {
    const gql = await request("POST", "/graphql", {
      query: "query { course(limit:1) { id title } }",
    }, token);
    console.log("  course query: OK");
  } catch (e) {
    console.log("  course query FAIL:", e.data?.errors?.[0]?.message || e.status);
  }

  try {
    const gql = await request("POST", "/graphql", {
      query: "query { course(limit:1) { id title chapters { id title } } }",
    }, token);
    console.log("  course.chapters: OK");
  } catch (e) {
    console.log("  course.chapters FAIL:", e.data?.errors?.[0]?.message || e.status);
  }

  try {
    const gql = await request("POST", "/graphql", {
      query: "query { course_chapters(limit:1) { id title lessons { id title } } }",
    }, token);
    console.log("  course_chapters.lessons: OK");
  } catch (e) {
    console.log("  course_chapters.lessons FAIL:", e.data?.errors?.[0]?.message || e.status);
  }

  try {
    const gql = await request("POST", "/graphql", {
      query: "query { course_lessons(limit:1) { id title lesson_type resource_collection video_section_id { id } exercise_id { id } audio_id { id } scenario_id { id } } }",
    }, token);
    console.log("  course_lessons (M2O fields included): OK");
  } catch (e) {
    const errMsg = e.data?.errors?.[0]?.message || e.status || "unknown";
    console.log("  course_lessons FAIL:", errMsg);
  }

  console.log("\nIf any FAIL above, the O2M alias / field doesn't exist in Directus GraphQL.");
  console.log("Run scripts/setup-course-schema.js to create missing fields/relations.");
}

main().catch((e) => { console.error(e); process.exit(1); });
