/**
 * Capture portfolio-grade screenshots of Eaton Home.
 * Usage: node scripts/capture-screenshots.mjs [baseUrl]
 * Outputs PNGs into portfolio/screenshots/ (2x for UI pages, 1x for the
 * heavy post-processed 3D scene, which renders via software WebGL in CI).
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.argv[2] ?? "http://127.0.0.1:4780";
const OUT = new URL("../portfolio/screenshots/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const DEMO_COOKIE = { name: "eaton_home_demo", value: "1", url: BASE };
const SHOT = { timeout: 120000 };

const settle = (page, ms = 2600) => page.waitForTimeout(ms);

async function step(name, fn) {
  try {
    await fn();
    console.log("ok:", name);
  } catch (e) {
    console.error("FAILED:", name, "-", e.message.split("\n")[0]);
  }
}

async function main() {
  const browser = await chromium.launch({
    args: ["--enable-unsafe-swiftshader", "--use-gl=swiftshader"],
  });

  // ---------- logged-out: login ----------
  await step("login", async () => {
    const ctx = await browser.newContext({
      viewport: { width: 1600, height: 1000 },
      deviceScaleFactor: 2,
    });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await settle(page);
    await page.screenshot({ path: `${OUT}login.png`, ...SHOT });
    await ctx.close();
  });

  // ---------- desktop UI pages (2x) ----------
  const ctx = await browser.newContext({
    viewport: { width: 1600, height: 1000 },
    deviceScaleFactor: 2,
  });
  await ctx.addCookies([DEMO_COOKIE]);
  const page = await ctx.newPage();

  await step("dashboard", async () => {
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await settle(page, 4500);
    await page.screenshot({ path: `${OUT}dashboard.png`, ...SHOT });
  });

  await step("projects_master_list", async () => {
    await page.goto(`${BASE}/projects`, { waitUntil: "networkidle" });
    await settle(page);
    await page.screenshot({ path: `${OUT}projects_master_list.png`, ...SHOT });
  });

  await step("projects_by_category", async () => {
    await page.getByRole("tab", { name: "By category" }).click();
    await settle(page, 1800);
    await page.screenshot({ path: `${OUT}projects_by_category.png`, ...SHOT });
  });

  await step("project_detail", async () => {
    await page.goto(`${BASE}/projects/p-ev-charger`, { waitUntil: "networkidle" });
    await settle(page);
    await page.getByRole("button", { name: /check prices/i }).click();
    await page.waitForSelector("text=Lowest", { timeout: 15000 });
    await settle(page, 800);
    await page.screenshot({ path: `${OUT}project_detail.png`, ...SHOT });
    await page.mouse.wheel(0, 520);
    await settle(page, 900);
    await page.screenshot({ path: `${OUT}project_detail_pricing.png`, ...SHOT });
  });

  await step("home_care", async () => {
    await page.goto(`${BASE}/tasks`, { waitUntil: "networkidle" });
    await settle(page);
    await page.screenshot({ path: `${OUT}home_care.png`, ...SHOT });
  });

  await step("budget", async () => {
    await page.goto(`${BASE}/budget`, { waitUntil: "networkidle" });
    await settle(page);
    await page.screenshot({ path: `${OUT}budget.png`, ...SHOT });
  });

  await step("changelog", async () => {
    await page.goto(`${BASE}/changelog`, { waitUntil: "networkidle" });
    await settle(page);
    await page.screenshot({ path: `${OUT}changelog.png`, ...SHOT });
  });

  await step("settings_themes", async () => {
    await page.getByLabel("Settings").first().click();
    await settle(page, 900);
    await page.screenshot({ path: `${OUT}settings_themes.png`, ...SHOT });
    await page.keyboard.press("Escape");
  });
  await ctx.close();

  // ---------- 3D house (1x — post-processing is heavy under swiftshader) ----------
  const ctx3d = await browser.newContext({
    viewport: { width: 1600, height: 1000 },
    deviceScaleFactor: 1,
  });
  await ctx3d.addCookies([DEMO_COOKIE]);
  const hpage = await ctx3d.newPage();

  await step("house_3d", async () => {
    await hpage.goto(`${BASE}/house`, { waitUntil: "networkidle" });
    await settle(hpage, 9000);
    await hpage.screenshot({ path: `${OUT}house_3d.png`, ...SHOT });
  });

  await step("house_3d_selected", async () => {
    await hpage
      .locator("button")
      .filter({ hasText: "Priority #2" })
      .first()
      .click({ noWaitAfter: true, timeout: 8000 });
    await settle(hpage, 1500);
    await hpage.screenshot({ path: `${OUT}house_3d_selected.png`, ...SHOT });
  });

  await step("house_3d_back", async () => {
    // close selected card, then orbit ~150°
    const close = hpage.getByRole("button", { name: "Close" });
    if (await close.isVisible().catch(() => false)) {
      await close.click({ noWaitAfter: true });
    }
    const canvas = hpage.locator("canvas").first();
    const box = await canvas.boundingBox();
    const cx = box.x + box.width * 0.62;
    const cy = box.y + box.height * 0.55;
    await hpage.mouse.move(cx, cy);
    await hpage.mouse.down();
    await hpage.mouse.move(cx - 520, cy - 40, { steps: 24 });
    await hpage.mouse.up();
    await settle(hpage, 2000);
    await hpage.screenshot({ path: `${OUT}house_3d_back.png`, ...SHOT });
  });

  await step("home_facts", async () => {
    await hpage.evaluate(() => window.scrollBy(0, window.innerHeight));
    await settle(hpage, 1200);
    await hpage.screenshot({ path: `${OUT}home_facts.png`, ...SHOT });
  });
  await ctx3d.close();

  // ---------- mobile ----------
  await step("mobile_dashboard", async () => {
    const mctx = await browser.newContext({
      viewport: { width: 430, height: 932 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    await mctx.addCookies([DEMO_COOKIE]);
    const mpage = await mctx.newPage();
    await mpage.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await settle(mpage, 4000);
    await mpage.screenshot({ path: `${OUT}mobile_dashboard.png`, ...SHOT });
    await mctx.close();
  });

  await step("mobile_house", async () => {
    const mctx = await browser.newContext({
      viewport: { width: 430, height: 932 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
    });
    await mctx.addCookies([DEMO_COOKIE]);
    const mpage = await mctx.newPage();
    await mpage.goto(`${BASE}/house`, { waitUntil: "networkidle" });
    await settle(mpage, 8000);
    await mpage.screenshot({ path: `${OUT}mobile_house.png`, ...SHOT });
    await mctx.close();
  });

  await browser.close();
  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
