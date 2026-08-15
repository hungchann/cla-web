/**
 * scripts/grant-course-permissions.js
 *
 * Grant READ access to "course", "course_chapters", "course_lessons"
 * for authenticated users (and optionally public).
 *
 * Run:
 *   node scripts/grant-course-permissions.js
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

  // Find authenticated role
  const roles = (await request("GET", "/roles", null, token)).data?.data || [];
  console.log("Roles found:", roles.map((r) => `${r.name} (${r.id})`).join(", "));

  // Grant read to all non-admin roles. Patch existing permissions as well so
  // newly added typed lesson fields (for example vocab_display_map_id) are
  // not blocked by an older field allow-list.
  for (const role of roles) {
    if (role.admin_access) continue; // skip admin — already has full access

    for (const collection of [
      "course",
      "course_chapters",
      "course_lessons",
      "lesson_video",
      "lesson_theory",
      "lesson_extra",
      "lesson_vocab",
      "lesson_questions",
      "lesson_theory_cards",
      "lesson_dictation",
      "lesson_dialogues",
      "banners",
    ]) {
      try {
        const existing = (await request("GET", `/permissions?filter[role][_eq]=${role.id}&filter[collection][_eq]=${collection}&filter[action][_eq]=read`, null, token)).data?.data || [];
        if (existing[0]) {
          await request("PATCH", `/permissions/${existing[0].id}`, { fields: ["*"] }, token);
          console.log(`  ✓ ${role.name}: updated read fields on ${collection}`);
        } else {
          await request("POST", "/permissions", {
            role: role.id,
            collection: collection,
            action: "read",
            policy: { name: `Allow ${role.name} read ${collection}` },
            fields: ["*"],
          }, token);
          console.log(`  ✓ ${role.name}: created read permission on ${collection}`);
        }
      } catch (e) {
        const msg = e.data?.errors?.[0]?.message || e.status;
        console.log(`  ✗ ${role.name}: read on ${collection} — ${msg}`);
      }
    }
  }

  console.log("\nDone. Try /courses in browser now.");
}

main().catch((e) => { console.error(e); process.exit(1); });
