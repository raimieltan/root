# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: campaign.spec.ts >> operation selection → all Red campaign results → reconstruction → unlocks
- Location: tests/browser/campaign.spec.ts:4:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('#command')
Expected: visible
Timeout: 30000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('#command') with timeout 30000ms
  - waiting for locator('#command')

```

```yaml
- main:
  - text: ROOT/OS
  - paragraph: Provisioning operation…
  - link "Operations":
    - /url: /
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { campaign } from "../../lib/simulation/scenarios";
  3  | 
  4  | test("operation selection → all Red campaign results → reconstruction → unlocks", async ({ page }) => {
  5  |   const errors: string[] = []; page.on("pageerror", (e) => errors.push(e.message));
  6  |   await page.goto("/");
  7  |   for (const operation of campaign) {
  8  |     await page.getByRole("button", { name: new RegExp(operation.name) }).click();
  9  |     await page.getByRole("link", { name: `Launch ${operation.name}` }).click();
> 10 |     await expect(page.locator("#command")).toBeVisible();
     |                                            ^ Error: expect(locator).toBeVisible() failed
  11 |     for (const command of operation.blueProfiles[0].commands) {
  12 |       await page.locator("#command").fill(command);
  13 |       const response = page.waitForResponse((r) => r.url().includes("/api/sim/command") && r.request().method() === "POST");
  14 |       await page.locator("#command").press("Enter");
  15 |       expect((await response).ok(), command).toBe(true);
  16 |     }
  17 |     await expect(page.getByText("OBJECTIVE SECURED")).toBeVisible();
  18 |     await page.getByRole("link", { name: "Open reconstruction" }).click();
  19 |     await expect(page.getByRole("heading", { name: new RegExp(`${operation.name}.*RECONSTRUCTION`) })).toBeVisible();
  20 |     for (const lens of ["RED VIEW", "BLUE VIEW", "FULL TRUTH"]) await page.getByRole("button", { name: new RegExp(lens) }).click();
  21 |     await expect(page.getByText("Demonstrated knowledge", { exact: true })).toBeVisible();
  22 |     await page.getByRole("link", { name: "START ANOTHER OPERATION" }).click();
  23 |   }
  24 |   await expect(page.getByText("MVP CAMPAIGN COMPLETE")).toBeVisible();
  25 |   await page.reload();
  26 |   await expect(page.getByText("MVP CAMPAIGN COMPLETE")).toBeVisible();
  27 |   await expect(page.getByRole("link", { name: "Open reconstruction" })).toHaveCount(3);
  28 |   expect(errors).toEqual([]);
  29 |   await page.screenshot({ path: "/tmp/root-campaign-browser.png", fullPage: true });
  30 | });
  31 | 
  32 | test("Blue investigation, precise containment, results and replay", async ({ page }) => {
  33 |   await page.goto("/");
  34 |   await page.getByRole("button", { name: "Blue Team", exact: true }).click();
  35 |   await page.getByRole("link", { name: "Launch Operation Glasshouse" }).click();
  36 |   await expect(page.getByRole("button", { name: "Advance one step" })).toBeVisible();
  37 |   async function step() { const response = page.waitForResponse((r) => r.url().includes("/blue/advance")); await page.getByRole("button", { name: "Advance one step" }).click(); expect((await response).ok()).toBe(true); await expect(page.getByRole("button", { name: "Advance one step" })).toBeVisible(); }
  38 |   await step();
  39 |   await expect(page.getByRole("button", { name: "Investigate and pin" }).first()).toBeVisible();
  40 |   await page.getByRole("button", { name: "Investigate and pin" }).first().click();
  41 |   await page.getByLabel("Finding", { exact: true }).fill("Concentrated probing merits host and identity correlation.");
  42 |   await page.getByRole("button", { name: "Record finding" }).click();
  43 |   await expect(page.getByText("linked observations")).toBeVisible();
  44 |   await page.getByLabel("Host", { exact: true }).selectOption({ label: "FIN-DB // HEALTHY" });
  45 |   await page.getByRole("button", { name: "Isolate host", exact: true }).click();
  46 |   await expect(page.getByText(/Finance: OFFLINE/).first()).toBeVisible();
  47 |   for (let i = 0; i < 25; i++) {
  48 |     if (await page.getByRole("link", { name: "Open reconstruction" }).count()) break;
  49 |     await step();
  50 |     await page.waitForTimeout(150);
  51 |   }
  52 |   await expect(page.getByText("OBJECTIVE PROTECTED", { exact: true })).toBeVisible();
  53 |   await page.getByRole("link", { name: "Open reconstruction" }).click();
  54 |   await expect(page.getByText("BLUE outcome: SUCCESS", { exact: false })).toBeVisible();
  55 | });
  56 | 
```