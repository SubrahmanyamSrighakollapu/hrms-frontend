import { defineConfig, devices } from "@playwright/test";

/**
 * UI end-to-end tests.
 *
 * Prerequisites (both must already be running):
 *   - frontend:  http://localhost:3000   (npm run dev)
 *   - backend:   http://localhost:5000   (npm run dev)
 *
 * Run:  npx playwright test
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    headless: true,
    viewport: { width: 1440, height: 900 },
    screenshot: "only-on-failure",
    trace: "off",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],
});
