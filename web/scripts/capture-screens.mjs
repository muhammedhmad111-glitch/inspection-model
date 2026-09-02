// Captures real CPIIS screens into public/video/, which the SystemOverview
// Remotion composition renders. The dev server must already be on :3000.
//
//   CPIIS_EMAIL=... CPIIS_PASSWORD=... node scripts/capture-screens.mjs
//
// Screens the signed-in account lacks permission for are skipped rather than
// saved as a redirect to the dashboard — sign in with the access you want on
// camera. Captured at 2x so the shots stay sharp scaled into a 1080p frame.
import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const CHROME = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = process.env.CPIIS_BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.CPIIS_EMAIL ?? "admin@cimpor-amreyah.local";
const PASSWORD = process.env.CPIIS_PASSWORD ?? "ChangeMe123!";
const OUT = path.join(process.cwd(), "public", "video");

const SHOTS = [
  { name: "dashboard", url: "/" },
  { name: "areas", url: "/master-data/areas" },
  { name: "sections", url: "/master-data/sections" },
  { name: "equipment", url: "/master-data/equipment" },
  { name: "library", url: "/library" },
  { name: "activities", url: "/activities" },
  { name: "scheduling", url: "/scheduling" },
  { name: "tasks", url: "/tasks" },
  { name: "calendar", url: "/calendar" },
  { name: "findings", url: "/findings" },
  { name: "actions", url: "/actions" },
  { name: "reports", url: "/reports" },
  { name: "notifications", url: "/notifications" },
  { name: "users", url: "/admin/users" },
  { name: "permissions", url: "/admin/permissions" },
  { name: "audit", url: "/audit" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Kill the Next.js dev-tools badge so it never shows up in the video.
const HIDE_DEV_BADGE = `nextjs-portal,[data-nextjs-toast],#__next-build-watcher{display:none !important}`;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "shell",
  defaultViewport: { width: 1600, height: 1000, deviceScaleFactor: 2 },
  args: ["--force-device-scale-factor=2", "--hide-scrollbars", "--lang=ar-EG"],
});

const page = await browser.newPage();
await page.evaluateOnNewDocument((css) => {
  document.addEventListener("DOMContentLoaded", () => {
    const s = document.createElement("style");
    s.textContent = css;
    document.head.appendChild(s);
  });
}, HIDE_DEV_BADGE);
await fs.mkdir(OUT, { recursive: true });

// ── Login ──────────────────────────────────────────────────────────────
await page.goto(`${BASE}/login`, { waitUntil: "networkidle2", timeout: 120000 });
await page.type('input[type="email"]', EMAIL);
await page.type('input[type="password"]', PASSWORD);
await page.click('button[type="submit"]');
// Login is a server action → client transition, not a full navigation. Poll the URL.
for (let i = 0; i < 90 && new URL(page.url()).pathname === "/login"; i++) await sleep(1000);
if (new URL(page.url()).pathname === "/login") {
  console.error("LOGIN FAILED:\n", await page.evaluate(() => document.body.innerText));
  await browser.close();
  process.exit(1);
}
console.log("logged in ->", page.url());

/** Navigate, confirm we landed where we asked, let React settle, then shoot. */
async function shoot(name, url, extraWait = 3000) {
  await page.goto("about:blank");
  await page.goto(BASE + url, { waitUntil: "networkidle2", timeout: 180000 });
  const landed = new URL(page.url()).pathname;
  if (landed !== url) {
    console.error(`SKIP ${name}: redirected ${url} -> ${landed} (no permission)`);
    return false;
  }
  await page.evaluate((css) => {
    const s = document.createElement("style");
    s.textContent = css;
    document.head.appendChild(s);
  }, HIDE_DEV_BADGE);
  await sleep(extraWait);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log("captured", name);
  return true;
}

for (const s of SHOTS) {
  try {
    await shoot(s.name, s.url);
  } catch (err) {
    console.error("FAILED", s.name, err.message);
  }
}

// ── Dashboard analytics tabs ───────────────────────────────────────────
await shoot("dashboard", "/");
const tabs = await page.$$('[role="tab"]');
console.log("dashboard tabs:", tabs.length);
for (let i = 1; i < tabs.length && i < 4; i++) {
  await tabs[i].click();
  await sleep(2500);
  await page.screenshot({ path: path.join(OUT, `dashboard-tab${i}.png`) });
  console.log("captured dashboard-tab" + i);
}

// ── Task detail + the same screen on a phone ───────────────────────────
await shoot("tasks", "/tasks");
const taskHref = await page.evaluate(() => {
  const a = document.querySelector('a[href^="/tasks/"]');
  return a ? a.getAttribute("href") : null;
});
if (taskHref) {
  await shoot("task-detail", taskHref, 3500);
  await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 3, isMobile: true });
  await page.reload({ waitUntil: "networkidle2", timeout: 180000 });
  await page.evaluate((css) => {
    const s = document.createElement("style");
    s.textContent = css;
    document.head.appendChild(s);
  }, HIDE_DEV_BADGE);
  await sleep(3500);
  await page.screenshot({ path: path.join(OUT, "task-mobile.png") });
  console.log("captured task-mobile");
} else {
  console.error("no task link found");
}

await browser.close();
console.log("done ->", OUT);
