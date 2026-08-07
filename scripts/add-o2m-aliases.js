/**
 * scripts/add-o2m-aliases.js
 *
 * Create O2M aliases so GraphQL queries like:
 *   course { chapters { lessons { ... } } }
 * work without separate queries.
 *
 * When tables are created via raw SQL, Directus doesn't auto-generate
 * the inverse O2M alias fields. This script creates them manually.
 *
 * Run:
 *   node scripts/add-o2m-aliases.js
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

const ALIASES = [
  {
    collection: "course",
    field: "chapters",
    type: "alias",
    schema: null,
    meta: { interface: "list-o2m", special: ["o2m"], options: { fields: ["id", "title", "sort", "status"] } },
  },
  {
    collection: "course_chapters",
    field: "lessons",
    type: "alias",
    schema: null,
    meta: { interface: "list-o2m", special: ["o2m"], options: { fields: ["id", "title", "sort", "lesson_type", "status"] } },
  },
];

const O2M_RELATIONS = [
  {
    collection: "course",
    field: "chapters",
    related_collection: "course_chapters",
    schema: null,
    meta: { one_field: "course_id", sort_field: "sort" },
  },
  {
    collection: "course_chapters",
    field: "lessons",
    related_collection: "course_lessons",
    schema: null,
    meta: { one_field: "chapter_id", sort_field: "sort" },
  },
];

async function main() {
  const token = await login();
  console.log("✓ Logged in\n");

  const existing = (await request("GET", "/relations", null, token)).data?.data || [];

  for (let i = 0; i < ALIASES.length; i++) {
    const alias = ALIASES[i];
    const rel = O2M_RELATIONS[i];

    // Check if relation already exists
    const exists = existing.some(
      (r) => r.collection === rel.collection && r.field === rel.field
    );
    if (exists) {
      console.log(`  − ALREADY EXISTS: ${rel.collection}.${rel.field}`);
      continue;
    }

    // Step 1: Create the alias field (type: alias, interface: list-o2m)
    try {
      await request("POST", `/fields/${alias.collection}`, alias, token);
      console.log(`  ✓ Created field: ${alias.collection}.${alias.field}`);
    } catch (e) {
      const msg = e.data?.errors?.[0]?.message || e.status;
      if (msg?.includes("already")) {
        console.log(`  − Field exists: ${alias.collection}.${alias.field}`);
      } else {
        console.log(`  ✗ Field FAIL: ${alias.collection}.${alias.field} — ${msg}`);
        continue;
      }
    }

    // Step 2: Create the O2M relation
    try {
      await request("POST", "/relations", rel, token);
      console.log(`  ✓ Created relation: ${rel.collection}.${rel.field} → ${rel.related_collection}`);
    } catch (e) {
      console.log(`  ✗ Relation FAIL: ${rel.collection}.${rel.field} — ${e.data?.errors?.[0]?.message || e.status}`);
    }
  }

  console.log("\nVerify:");
  console.log("  node scripts/verify-course-relations.js");
}

main().catch((e) => { console.error(e); process.exit(1); });
