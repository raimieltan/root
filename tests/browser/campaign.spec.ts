import { test, expect } from "@playwright/test";
import { campaign } from "../../lib/simulation/scenarios";

test("operation selection → all Red campaign results → reconstruction → unlocks", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  for (const operation of campaign) {
    await page.getByRole("button", { name: new RegExp(operation.name) }).click();
    await page.getByRole("link", { name: `Launch ${operation.name}` }).click();
    await expect(page.locator("#command")).toBeVisible();
    for (const command of operation.blueProfiles[0].commands) {
      await page.locator("#command").fill(command);
      const response = page.waitForResponse((r) => r.url().includes("/api/sim/command") && r.request().method() === "POST");
      await page.locator("#command").press("Enter");
      expect((await response).ok(), command).toBe(true);
    }
    await expect(page.getByText("OBJECTIVE SECURED")).toBeVisible();
    await page.getByRole("link", { name: "Open reconstruction" }).click();
    await expect(page.getByRole("heading", { name: new RegExp(`${operation.name}.*RECONSTRUCTION`) })).toBeVisible();
    for (const lens of ["RED VIEW", "BLUE VIEW", "FULL TRUTH"]) await page.getByRole("button", { name: new RegExp(lens) }).click();
    await expect(page.getByText("Demonstrated knowledge", { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "START ANOTHER OPERATION" }).click();
  }
  await expect(page.getByText("MVP CAMPAIGN COMPLETE")).toBeVisible();
  await page.reload();
  await expect(page.getByText("MVP CAMPAIGN COMPLETE")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open reconstruction" })).toHaveCount(3);
  expect(errors).toEqual([]);
  await page.screenshot({ path: "/tmp/root-campaign-browser.png", fullPage: true });
});

test("Blue investigation, precise containment, results and replay", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Blue Team", exact: true }).click();
  await page.getByRole("link", { name: "Launch Operation Glasshouse" }).click();
  await expect(page.getByRole("button", { name: "Advance one step" })).toBeVisible();
  async function step() { const response = page.waitForResponse((r) => r.url().includes("/blue/advance")); await page.getByRole("button", { name: "Advance one step" }).click(); expect((await response).ok()).toBe(true); await expect(page.getByRole("button", { name: "Advance one step" })).toBeVisible(); }
  await step();
  await expect(page.getByRole("button", { name: "Investigate and pin" }).first()).toBeVisible();
  await page.getByRole("button", { name: "Investigate and pin" }).first().click();
  await page.getByLabel("Finding", { exact: true }).fill("Concentrated probing merits host and identity correlation.");
  const findingResponse = page.waitForResponse((response) => response.url().includes("/blue/respond") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Record finding" }).click();
  expect((await findingResponse).ok()).toBe(true);
  await expect(page.getByText("linked observations")).toBeVisible();
  const host = page.locator(".soc-host select");
  await expect(host).toBeEnabled();
  await host.selectOption({ label: "FIN-DB // HEALTHY" });
  const isolateResponse = page.waitForResponse((response) => response.url().includes("/blue/respond") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Isolate host", exact: true }).click();
  expect((await isolateResponse).ok()).toBe(true);
  await expect(page.getByText(/Finance: OFFLINE/).first()).toBeVisible();
  for (let i = 0; i < 25; i++) {
    if (await page.getByRole("link", { name: "Open reconstruction" }).count()) break;
    await step();
    await page.waitForTimeout(150);
  }
  await expect(page.getByText("OBJECTIVE PROTECTED", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Open reconstruction" }).click();
  await expect(page.getByText("BLUE outcome: SUCCESS", { exact: false })).toBeVisible();
});
