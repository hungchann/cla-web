/**
 * scripts/cleanup-dictations.js
 *
 * Delete duplicate dictation & reading lessons, keep only the canonical ones.
 * Keep: dictation id=37 (sort=5), reading id=29 (sort=8)
 * Delete: dictation ids 17,23,18,24,19,25,20,26,21,27,22,28,38 + reading id=36
 * Run:
 *   $env:DIRECTUS_ADMIN_EMAIL="admin@marutek.space"
 *   $env:DIRECTUS_ADMIN_PASSWORD="***"
 *   node scripts/cleanup-dictations.js
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

  // Delete duplicate dictation lessons (keep only id=37)
  const dictationIdsToDelete = [17, 23, 18, 24, 19, 25, 20, 26, 21, 27, 22, 28, 38];
  console.log("=== Deleting duplicate dictation lessons ===");
  for (const id of dictationIdsToDelete) {
    try {
      await request("DELETE", `/items/course_lessons/${id}`, null, token);
      console.log(`  ✓ Deleted dictation #${id}`);
    } catch (e) {
      console.log(`  − Delete #${id} skipped: ${e.status}`);
    }
  }

  // Delete duplicate reading lesson (keep only id=29)
  console.log("\n=== Deleting duplicate reading lesson ===");
  try {
    await request("DELETE", `/items/course_lessons/36`, null, token);
    console.log(`  ✓ Deleted reading #36`);
  } catch (e) {
    console.log(`  − Delete #36 skipped: ${e.status}`);
  }

  console.log("\nDone. Each lesson type should appear exactly once now.");
}

main().catch((e) => { console.error(e); process.exit(1); });
