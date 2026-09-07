import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests — drive a REAL running Mendix app that hosts both widgets.
 *
 * These are NOT part of `npm test` or CI by default: they need a Mendix runtime
 * (Studio Pro or `mx` CLI) serving `tests/testProject` at http://localhost:8080,
 * with a page that contains a Rich Text editor + Rich Text Viewer bound to the
 * same attribute. See `tests/e2e/README.md`.
 *
 * Run: start the app, then `npm run test:e2e` (from `pluggable/`).
 */
export default defineConfig({
    testDir: "tests/e2e",
    testMatch: "**/*.e2e.ts",
    timeout: 60_000,
    expect: { timeout: 15_000 },
    fullyParallel: false,
    workers: 1,
    forbidOnly: !!process.env.CI,
    retries: 0,
    reporter: "list",
    use: {
        baseURL: process.env.MX_APP_URL ?? "http://localhost:8080",
        trace: "retain-on-failure",
        screenshot: "only-on-failure"
    },
    projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]
});
