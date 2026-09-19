import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto("http://localhost:3000/blue", { waitUntil: "networkidle" });
await page.fill('input[autocomplete="current-password"]', "x");
await page.click('button[type="submit"]');
await page.waitForSelector(".soc-dashboard", { timeout: 20000 });
await page.waitForTimeout(800);
await page.screenshot({ path: "/private/tmp/claude-501/-Users-sean-Documents-root/056c32d0-d527-4159-8e3b-c34746a59f0e/scratchpad/blue-dashboard.png" });
await browser.close();
