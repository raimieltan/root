import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser", timeout: 120_000, expect: { timeout: 30_000 }, workers: 1,
  use: { baseURL: "http://127.0.0.1:3001", viewport: { width: 1440, height: 1000 }, trace: "retain-on-failure", launchOptions: { executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" } },
  webServer: {
    command: "yarn next build --webpack && yarn next start --hostname 127.0.0.1 --port 3001",
    url: "http://127.0.0.1:3001",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
