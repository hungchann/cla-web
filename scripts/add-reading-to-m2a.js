/**
 * scripts/add-reading-to-m2a.js
 *
 * Add "Sections" to the M2A allowed collections for course_lessons.resource_id.
 *
 * Run:
 *   node scripts/add-reading-to-m2a.js
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
  const e = process.env.DIRECTUS_ADMIN_EMAIL || (await ((rl) => new Promise((r) => rl.question("  Email: ", r)))(readline.createInterface({ input: process.stdin, output: process.stdout })));
  const p = process.env.DIRECTUS_ADMIN_PASSWORD || (await ((rl) => new Promise((r) => rl.question("  Password: ", r)))(readline.createInterface({ input: process.stdin, output: process.stdout })));
  const res = await request("POST", "/auth/login", { email: e.trim(), password: p });
  return res.data?.data?.access_token;
}

async function main() {
  const token = await login();
  console.log("✓ Logged in\n");

  // Find the M2A relation ID
  const relations = (await request("GET", "/relations", null, token)).data?.data || [];
  const m2a = relations.find((r) => r.collection === "course_lessons" && r.field === "resource_id");
  if (!m2a) { console.log("✗ M2A relation not found"); process.exit(1); }

  console.log(`· Found relation: collection=${m2a.collection} field=${m2a.field}`);

  // Directus identifies relations by composite key or id
  const relId = m2a.id;
  const allowed = m2a.meta?.one_allowed_collections || [];

  // Deep clone to avoid mutating the read-only response
  const newAllowed = [...allowed];
  if (newAllowed.includes("Sections")) {
    console.log("  − 'Sections' already in whitelist");
  } else {
    newAllowed.push("Sections");
    if (relId != null) {
      await request("PATCH", `/relations/${relId}`, { meta: { one_allowed_collections: newAllowed } }, token);
    } else {
      // Composite key: PATCH via /relations/{collection}/{field}
      await request("PATCH", `/relations/${encodeURIComponent(m2a.collection)}/${encodeURIComponent(m2a.field)}`, { meta: { one_allowed_collections: newAllowed } }, token);
    }
    console.log(`  ✓ Added 'Sections' -> new whitelist: ${JSON.stringify(newAllowed)}`);
  }
  console.log("Done. Now Sections can be selected in course_lessons M2A dropdown.");
}

main().catch((e) => { console.error(e); process.exit(1); });
