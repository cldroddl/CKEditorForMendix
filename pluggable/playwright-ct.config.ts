import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/experimental-ct-react";

/**
 * Component tests — mount the widget's React components in a real Chromium and
 * exercise behaviour that jsdom can't (real click semantics, and CKEditor 4,
 * which needs `document.execCommand` / Range and a served plugin tree).
 *
 * The `<Editor>` tests load the CKEditor 4 runtime from the widget's own build
 * output, served as static files — `pretest:ct` runs `npm run build` first, and
 * the tests skip themselves if `dist/tmp/.../assets/ckeditor` is missing.
 *
 * Run: `npm run test:ct` (from `pluggable/`). Not part of `npm test`.
 *
 * Browser: by default Playwright's own Chromium (`npx playwright install chromium`).
 * Behind a proxy that blocks Playwright's CDN, set `PW_CHROME_CHANNEL=chrome` (or
 * `msedge`) to drive the copy of Chrome / Edge already installed on the machine —
 * no download. `PW_CHROME_PATH=C:\path\to\chrome.exe` points at an arbitrary
 * build (e.g. an unpacked "Chrome for Testing").
 */
const channel = process.env.PW_CHROME_CHANNEL;
const executablePath = process.env.PW_CHROME_PATH;

export default defineConfig({
    testDir: "tests/ct",
    testMatch: "**/*.ct.tsx",
    snapshotDir: "tests/ct/__snapshots__",
    timeout: 30_000,
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? "blob" : "list",
    use: {
        trace: "on-first-retry",
        ctPort: 3100,
        ctViteConfig: {
            // Serve the built CKEditor 4 runtime at /ckeditorformendix/richtext/assets/ckeditor/…
            publicDir: resolve("packages/rich-text/dist/tmp/widgets"),
            resolve: {
                alias: {
                    "@ckeditorformendix/shared": resolve("packages/shared/src/index.ts")
                }
            }
        }
    },
    projects: [
        {
            name: "chromium",
            use: {
                ...devices["Desktop Chrome"],
                ...(channel ? { channel } : {}),
                ...(executablePath ? { launchOptions: { executablePath } } : {})
            }
        }
    ]
});
