import { test, expect } from "@playwright/test";
import { campaign } from "../../lib/simulation/scenarios";

test("operation selection → all Red campaign results → reconstruction → unlocks", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  for (const [operationIndex, operation] of campaign.entries()) {
    await page.getByRole("button", { name: new RegExp(operation.name) }).click();
    await page.getByRole("link", { name: `Launch ${operation.name}` }).click();
    await expect(page.locator("#command")).toBeVisible();
    const profile = operation.id === "glasshouse" ? operation.blueProfiles[1] : operation.id === "dead-drop" ? operation.blueProfiles[1] : operation.blueProfiles[0];
    for (const [index, command] of profile.commands.entries()) {
      await page.locator("#command").fill(command);
      const response = page.waitForResponse((r) => r.url().includes("/api/sim/command") && r.request().method() === "POST");
      await page.locator("#command").press("Enter");
      expect((await response).ok(), command).toBe(true);
      if (index === 0) {
        await page.reload();
        await expect(page.locator("#command")).toBeVisible();
      }
    }
    await expect(page.getByText("OBJECTIVE SECURED")).toBeVisible();
    await page.getByRole("link", { name: "Open reconstruction" }).click();
    await expect(page.getByRole("heading", { name: new RegExp(`${operation.name}.*RECONSTRUCTION`) })).toBeVisible();
    for (const lens of ["RED VIEW", "BLUE VIEW", "FULL TRUTH"]) await page.getByRole("button", { name: new RegExp(lens) }).click();
    await expect(page.getByText("Demonstrated knowledge", { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "START ANOTHER OPERATION" }).click();
    if (operationIndex === 2) {
      await expect(page.getByRole("heading", { name: "Operator", exact: true })).toBeVisible();
      await expect(page.getByText("Operator Mode: CLEARED", { exact: true })).toBeVisible();
    }
  }
  await expect(page.getByText("MVP CAMPAIGN COMPLETE")).toBeVisible();
  await page.reload();
  await expect(page.getByText("MVP CAMPAIGN COMPLETE")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open reconstruction" })).toHaveCount(campaign.length);
  expect(errors).toEqual([]);
  await page.screenshot({ path: "/tmp/root-campaign-browser.png", fullPage: true });
});

test("every Blue operation resolves and opens its reconstruction", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("root:campaign:v1", JSON.stringify([
    { scenarioId: "prior-glasshouse", actorId: "prior", definitionId: "glasshouse", name: "Operation Glasshouse", mode: "RED", assistance: "GUIDED", startedAt: "", result: { won: true, route: "application-chain", detected: true, concepts: [], availability: 100 } },
    { scenarioId: "prior-nightshift", actorId: "prior", definitionId: "nightshift", name: "Operation Nightshift", mode: "RED", assistance: "GUIDED", startedAt: "", result: { won: true, route: "endpoint-agent", detected: true, concepts: [], availability: 100 } },
    { scenarioId: "prior-dead-drop", actorId: "prior", definitionId: "dead-drop", name: "Operation Dead Drop", mode: "RED", assistance: "GUIDED", startedAt: "", result: { won: true, route: "partner-pivot", detected: true, concepts: [], availability: 100 } },
  ])));
  await page.goto("/");
  for (const operation of campaign) {
    await page.getByRole("button", { name: new RegExp(operation.name) }).click();
    await page.getByRole("button", { name: "Blue Team", exact: true }).click();
    await page.getByRole("link", { name: `Launch ${operation.name}` }).click();
    for (let step = 0; step < operation.blueProfiles[0].commands.length + 3; step++) {
      if (await page.getByRole("link", { name: "Open reconstruction" }).count()) break;
      const state = page.waitForResponse((r) => r.url().includes("/api/sim/state") && r.request().method() === "GET");
      const response = page.waitForResponse((r) => r.url().includes("/blue/advance") && r.request().method() === "POST");
      await page.getByRole("button", { name: "Advance one step" }).click();
      expect((await response).ok()).toBe(true);
      expect((await state).ok()).toBe(true);
      await expect(page.getByRole("link", { name: "Open reconstruction" }).or(page.locator("button:not([disabled])", { hasText: "Advance one step" }))).toBeVisible();
      if (step === 0) {
        await page.reload();
        await expect(page.getByRole("button", { name: "Advance one step" })).toBeVisible();
      }
    }
    await expect(page.getByRole("link", { name: "Open reconstruction" })).toBeVisible();
    await page.getByRole("link", { name: "Open reconstruction" }).click();
    await expect(page.getByRole("heading", { name: new RegExp(`${operation.name}.*RECONSTRUCTION`) })).toBeVisible();
    await page.getByRole("link", { name: "START ANOTHER OPERATION" }).click();
  }
});

test("Blue investigation, precise containment, results and replay", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Blue Team", exact: true }).click();
  await page.getByRole("link", { name: "Launch Operation Glasshouse" }).click();
  await expect(page.getByRole("button", { name: "Advance one step" })).toBeVisible();
  async function step() { const state = page.waitForResponse((r) => r.url().includes("/api/sim/state") && r.request().method() === "GET"); const response = page.waitForResponse((r) => r.url().includes("/blue/advance")); await page.getByRole("button", { name: "Advance one step" }).click(); expect((await response).ok()).toBe(true); expect((await state).ok()).toBe(true); await expect(page.getByRole("link", { name: "Open reconstruction" }).or(page.locator("button:not([disabled])", { hasText: "Advance one step" }))).toBeVisible(); }
  await step();
  await expect(page.getByText(/WINDOW \d{2}:\d{2} \/\/ 0\/1 REVIEWED \/\/ 0\/2 CONTAINED/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Investigate and pin" }).first()).toBeVisible();
  const pinResponse = page.waitForResponse((response) => response.url().includes("/blue/respond") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Investigate and pin" }).first().click();
  expect((await pinResponse).ok()).toBe(true);
  await expect(page.getByText("Synchronizing evidence and simulation state…")).toBeHidden();
  await expect(page.getByText(/WINDOW \d{2}:\d{2} \/\/ 1\/1 REVIEWED \/\/ 0\/2 CONTAINED/)).toBeVisible();
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
  await expect(page.getByText(/LAST RESPONSE \/\/ HOST ISOLATED · 67% AVAILABILITY/)).toBeVisible();
  for (let i = 0; i < 25; i++) {
    if (await page.getByRole("link", { name: "Open reconstruction" }).count()) break;
    await step();
    await page.waitForTimeout(150);
  }
  await expect(page.getByText("OBJECTIVE PROTECTED", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Open reconstruction" }).click();
  await expect(page.getByText("BLUE outcome: SUCCESS", { exact: false })).toBeVisible();
  for (const lens of ["RED VIEW", "BLUE VIEW", "FULL TRUTH"]) {
    await page.getByRole("button", { name: new RegExp(lens) }).click();
  }
  await expect(page.getByRole("button", { name: /FULL TRUTH/ })).toHaveClass(/active/);
});

test("Blue analysts correlate evidence and contain every viable route across operations", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("root:campaign:v1", JSON.stringify([
    { scenarioId: "prior-glasshouse", actorId: "prior", definitionId: "glasshouse", name: "Operation Glasshouse", mode: "RED", assistance: "GUIDED", startedAt: "", result: { won: true, route: "application-chain", detected: true, concepts: [], availability: 100 } },
    { scenarioId: "prior-nightshift", actorId: "prior", definitionId: "nightshift", name: "Operation Nightshift", mode: "RED", assistance: "GUIDED", startedAt: "", result: { won: true, route: "endpoint-agent", detected: true, concepts: [], availability: 100 } },
    { scenarioId: "prior-dead-drop", actorId: "prior", definitionId: "dead-drop", name: "Operation Dead Drop", mode: "RED", assistance: "GUIDED", startedAt: "", result: { won: true, route: "partner-pivot", detected: true, concepts: [], availability: 100 } },
  ])));

  async function step() {
    const response = page.waitForResponse((r) => r.url().includes("/blue/advance") && r.request().method() === "POST");
    await page.getByRole("button", { name: "Advance one step" }).click();
    expect((await response).ok()).toBe(true);
    await expect(page.getByText("Synchronizing evidence and simulation state…")).toBeHidden();
  }

  await page.goto("/");
  for (const operation of campaign) {
    await page.getByRole("button", { name: new RegExp(operation.name) }).click();
    await page.getByRole("button", { name: "Blue Team", exact: true }).click();
    await page.getByRole("link", { name: `Launch ${operation.name}` }).click();
    await step();
    await step();

    const investigate = page.getByRole("button", { name: "Investigate and pin" });
    if (await investigate.count()) {
      await investigate.first().click();
      await expect(page.getByText("Synchronizing evidence and simulation state…")).toBeHidden();
    } else {
      await page.getByRole("checkbox", { name: /Pin / }).first().check();
    }
    await page.getByLabel("Finding", { exact: true }).fill(`${operation.name}: host, identity, process, connection, and timeline support the active route.`);
    await page.getByRole("button", { name: "Record finding" }).click();
    await expect(page.getByText("linked observations")).toBeVisible();

    await expect(page.getByText("INCIDENT WORKSPACE // EVIDENCE CHAIN")).toBeVisible();
    await expect(page.getByText("UNCERTAINTY //")).toBeVisible();
    await expect(page.getByText("CONTAINMENT PLAN")).toBeVisible();
    await expect(page.getByText("Business impact:").first()).toBeVisible();

    const supported = page.getByRole("tab", { name: /SUPPORTED/ }).first();
    await expect(supported).toBeVisible();
    const plan = page.locator(".containment-plan");
    await expect(plan.getByText(/Blocks .*remain viable/).first()).toBeVisible();
    const contain = plan.locator("article").last().getByRole("button", { name: /Block link — contain/ });
    const containmentResponse = page.waitForResponse((response) => response.url().includes("/blue/respond") && response.request().method() === "POST");
    await contain.click();
    expect((await containmentResponse).ok()).toBe(true);
    await expect(page.getByRole("tab", { name: /CONTAINED/ })).toBeVisible();
    await page.goto("/");
  }
});

test("Career Hub records evidence review but reserves Operator Mode for demonstrated knowledge", async ({ page }) => {
  await page.goto("/career");
  await expect(page.getByText(/OPERATOR RECORD/)).toBeVisible();
  await page.getByRole("button", { name: /Trusted input review/ }).click();
  await page.getByRole("button", { name: /B \/\/ A deploy-controlled input is consumed by a root-owned service/ }).click();
  await expect(page.getByText(/REVIEW RECORDED/)).toBeVisible();
  await page.getByRole("button", { name: /Identity is not intent/ }).click();
  await page.getByRole("button", { name: /B \/\/ The source, timing, and destination are abnormal/ }).click();
  await expect(page.getByText(/REVIEW RECORDED/)).toBeVisible();
  await expect(page.getByText("GUIDED MODE REQUIRED", { exact: true })).toBeVisible();

  await page.addInitScript(() => localStorage.setItem("root:campaign:v1", JSON.stringify([
    { scenarioId: "career-glasshouse", actorId: "operator", definitionId: "glasshouse", name: "Operation Glasshouse", mode: "RED", assistance: "GUIDED", startedAt: "", result: { won: true, route: "application-chain", detected: true, concepts: ["Trust relationships", "Privilege escalation"], availability: 100 } },
    { scenarioId: "career-paper-trail", actorId: "operator", definitionId: "paper-trail", name: "Operation Paper Trail", mode: "RED", assistance: "OPERATOR", startedAt: "", result: { won: true, route: "vendor-reconciliation", detected: true, concepts: ["Trust relationships", "Identity correlation"], availability: 100 } },
    { scenarioId: "career-paper-trail-blue", actorId: "operator", definitionId: "paper-trail", name: "Operation Paper Trail", mode: "BLUE", assistance: "OPERATOR", startedAt: "", result: { won: true, route: "vendor-reconciliation", detected: true, concepts: ["Incident response", "Identity correlation"], availability: 67 } },
  ])));
  await page.goto("/career");
  await expect(page.getByText("Junior Operator", { exact: true })).toBeVisible();
  await expect(page.getByText("OPERATOR MODE CLEARED", { exact: true })).toBeVisible();
  await expect(page.getByText("NRO-1 // AWARDED", { exact: true })).toBeVisible();
  await expect(page.getByText("NIR-1 // AWARDED", { exact: true })).toBeVisible();
});
