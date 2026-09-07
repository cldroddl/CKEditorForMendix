import { expect, Page, test } from "@playwright/test";

/**
 * Assumes a page (default: the app home) with:
 *   - a Rich Text (CKEditor) editor  — "editorA"
 *   - a Rich Text Viewer (CKEditor)  — "viewer1"
 * both bound to the same String attribute, inside one Data view.
 *
 * See ./README.md for the Studio Pro wiring these specs expect.
 */

const APP_PAGE = process.env.MX_APP_PAGE ?? "/";

async function signInIfNeeded(page: Page): Promise<void> {
    const user = process.env.MX_USER;
    const password = process.env.MX_PASSWORD;
    if (!user || !password) {
        return;
    }
    if (await page.locator('input[name="username"], #username').count()) {
        await page.fill('input[name="username"], #username', user);
        await page.fill('input[name="password"], #password', password);
        await page.click('button[type="submit"], .login-button');
        await page.waitForLoadState("networkidle");
    }
}

test.beforeEach(async ({ page }) => {
    await page.goto(APP_PAGE);
    await signInIfNeeded(page);
});

test("editor and viewer both render the bound value", async ({ page }) => {
    await expect(page.locator(".cke_top").first()).toBeVisible();
    // The viewer renders the widget's own container; assert it is present and not empty-erroring.
    await expect(page.locator(".mx-name-viewer1, [data-mendix-id*='viewer1']").first()).toBeVisible();
});

test("typing in the editor propagates to the viewer", async ({ page }) => {
    const marker = `e2e-${Date.now()}`;
    const editable = page.locator(".cke_editable").first();
    await editable.click();
    await page.keyboard.type(marker);
    // Commit happens on blur.
    await page.locator("body").click({ position: { x: 5, y: 5 } });

    await expect(page.locator(".mx-name-viewer1, [data-mendix-id*='viewer1']").first()).toContainText(marker);
});

test("clicking a microflow link in the viewer fires its microflow", async ({ page }) => {
    const logs: string[] = [];
    page.on("console", msg => logs.push(msg.text()));

    const link = page
        .locator(".mx-name-viewer1 a.mx-microflow-link, [data-mendix-id*='viewer1'] a.mx-microflow-link")
        .first();
    test.skip(
        (await link.count()) === 0,
        "no microflow link in the rendered content — insert a 'Beta' link in editorA first"
    );

    await expect(link).not.toHaveClass(/mx-microflow-link--unbound/);
    await link.click();

    // NAV_LinkClicked logs to the browser console (swap for a UI assertion once
    // it has a Show message activity).
    await expect.poll(() => logs.some(l => l.includes("Microflow link clicked"))).toBe(true);
});
