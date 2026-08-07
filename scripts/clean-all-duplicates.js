/**
 * scripts/clean-all-duplicates.js
 *
 * Delete duplicate course_lessons, keeping only:
 *   10, 11, 12, 13, 37, 15, 16, 36  (8 clean rows)
 *
 * Run once:
 *   node scripts/clean-all-duplicates.js
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
    const req = https.request({ hostname: url.hostname, port: 443, path: url.pathname + url.search, method, headers }, (res) => {
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
  const e = process.env.DIRECTUS_ADMIN_EMAIL; const p = process.env.DIRECTUS_ADMIN_PASSWORD;
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

  const DELETE = [17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29];
  for (const id of DELETE) {
    try {
      await request("DELETE", `/items/course_lessons/${id}`, null, token);
      console.log(`  ✓ Deleted #${id}`);
    } catch (e) { console.log(`  − #${id} skipped: ${e.status}`); }
  }
  console.log(`\nDone. Kept: 10 11 12 13 37 15 16 36`);
}

main().catch((e) => { console.error(e); process.exit(1); });
