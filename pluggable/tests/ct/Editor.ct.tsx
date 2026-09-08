import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/experimental-ct-react";
import { Editor, EditorProps } from "../../packages/rich-text/src/components/Editor";

// Loads the REAL CKEditor 4 runtime (built into the widget's assets/) in Chromium.
// jsdom can't run CKEditor (execCommand / Range), so these live here.

// cwd is `pluggable/` (npm run test:ct).
const assetsBuilt = existsSync(
    resolve("packages/rich-text/dist/tmp/widgets/ckeditorformendix/richtext/assets/ckeditor/ckeditor.js")
);

test.skip(!assetsBuilt, "run `npm run build` first — CKEditor assets are served from dist/tmp");

const CKEDITOR_URL = "/ckeditorformendix/richtext/assets/ckeditor/ckeditor.js";

const baseProps: EditorProps = {
    value: "<p>hello</p>",
    disabled: false,
    scriptUrl: CKEDITOR_URL,
    useCustomToolbar: false,
    customToolbars: [],
    enterMode: "P",
    shiftEnterMode: "BR",
    autoParagraph: true,
    enableSpellCheck: true,
    bodyCssClass: "",
    width: 0,
    height: 0,
    maximizeOffset: 0,
    showStatusBar: true,
    showToolbarCollapsed: false,
    enableCodeHighlighting: false,
    imagePasteMode: "base64",
    useImageStyleProperty: false,
    countPlugin: false,
    countPluginMaxCount: 0,
    links: [{ name: "Alpha" }],
    toolbarDocument: true,
    toolbarClipboard: true,
    toolbarEditing: true,
    toolbarForms: true,
    toolbarSeperator1: true,
    toolbarBasicstyles: true,
    toolbarParagraph: true,
    toolbarLinks: true,
    toolbarInsert: true,
    toolbarSeperator2: true,
    toolbarStyles: true,
    toolbarColors: true,
    toolbarTools: true,
    toolbarOthers: true,
    onChange: () => {},
    onBlur: () => {},
    onKey: () => {}
};

test("loads CKEditor, renders a toolbar and seeds the value", async ({ mount, page }) => {
    const component = await mount(<Editor {...baseProps} />);

    await expect(component.locator(".cke_top")).toBeVisible({ timeout: 20_000 });
    await expect.poll(() => page.evaluate(() => (window as any).CKEDITOR?.status), { timeout: 20_000 }).toBe("loaded");
    const data = await page.evaluate(() => {
        const CK = (window as any).CKEDITOR;
        const inst = CK && Object.values(CK.instances)[0];
        return inst ? inst.getData() : "";
    });
    expect(data).toContain("hello");
});

test("shows the microflow-link toolbar button with its icon", async ({ mount, page }) => {
    const component = await mount(<Editor {...baseProps} />);
    await expect(component.locator(".cke_top")).toBeVisible({ timeout: 20_000 });

    const icon = page.locator(".cke_button__mendixlink_icon");
    await expect(icon).toHaveCount(1);
    // The plugin is JS-registered (no icon folder) so it styles the class itself
    // with an inline SVG data URI — regression guard for the "blank icon" bug.
    await expect(icon).toHaveCSS("background-image", /data:image\/svg\+xml/);
});

test("loads the full-preset plugin set (BASE_EXTRA_PLUGINS regression guard)", async ({ mount, page }) => {
    await mount(<Editor {...baseProps} />);
    await expect
        .poll(() => page.evaluate(() => Object.keys((window as any).CKEDITOR?.plugins?.registered ?? {})), {
            timeout: 20_000
        })
        .toEqual(
            expect.arrayContaining([
                "divarea",
                "mendixlink",
                "font",
                "colorbutton",
                "justify",
                "find",
                "copyformatting",
                "autogrow",
                "pastebase64"
            ])
        );
    // `flash` was removed (deprecated in CKEditor 4.11+).
    const hasFlash = await page.evaluate(() => "flash" in ((window as any).CKEDITOR?.plugins?.registered ?? {}));
    expect(hasFlash).toBe(false);
});

test("emits changed HTML through onChange", async ({ mount, page }) => {
    const changes: string[] = [];
    const component = await mount(<Editor {...baseProps} onChange={html => changes.push(html)} />);
    await expect(component.locator(".cke_editable")).toBeVisible({ timeout: 20_000 });

    const editable = component.locator(".cke_editable");
    await editable.click();
    await page.keyboard.type(" world");
    await expect.poll(() => changes.at(-1) ?? "").toContain("world");
});

test("falls back to a raw-HTML textarea when the script URL is bad", async ({ mount }) => {
    const component = await mount(<Editor {...baseProps} scriptUrl="/does-not-exist/ckeditor.js" />);
    const textarea = component.locator("textarea.rt-editor__fallback-input");
    await expect(textarea).toBeVisible({ timeout: 15_000 });
    await expect(textarea).toHaveValue("<p>hello</p>");
    await expect(component.locator(".rt-editor__error")).toContainText("could not be loaded");
});
