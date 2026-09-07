/**
 * DOMPurify sanitization for stored rich-text HTML, applied by the viewer before
 * `dangerouslySetInnerHTML`.
 *
 * Why this exists: CKEditor 4 is EOL (no security patches since 2023-06) and the
 * editor runs with `allowedContent: true` (ACF off) for legacy-full-build parity,
 * so anything pasted / imported / written by a microflow is persisted verbatim.
 * Without this pass, stored HTML containing `<script>`, `on*` handlers or
 * `javascript:` URLs would execute in every viewer's session (stored XSS).
 *
 * ORDERING: this must run AFTER `migrateStoredValue()` — that helper reads the
 * legacy inline `onclick="CKEditorViewer.mf.exec(...)"` to recover `data-mf`, and
 * DOMPurify strips `onclick` before it could. See `migrateStoredValue`.
 *
 * iframe policy: `<iframe>` is dropped (DOMPurify default). The editor's `iframe`
 * plugin button and legacy `oembed` embeds (`<div class="embededContent">`) are
 * the only sources; matches the CKEditor 5 branch, which also has no iframe
 * insertion. To allow specific hosts later, add `ADD_TAGS: ["iframe"]` plus an
 * `uponSanitizeElement` host-allowlist hook here (a viewer-side render filter, so
 * widening it retroactively "un-hides" already-stored embeds).
 */

import DOMPurify, { type Config } from "dompurify";

/** `data:` image URIs kept on `<img src>` — raster only, never `svg+xml` (SVG is a script vector). */
const RASTER_DATA_URI = /^data:image\/(?:png|jpe?g|gif|webp);base64,/i;

const BASE_CONFIG: Config = {
    // HTML only — no SVG / MathML namespaces (the widget never produces them and
    // they are common mXSS vectors).
    USE_PROFILES: { html: true },
    // data-mf (microflow links) and data-image-guid (image resolution). This is
    // the DOMPurify default; set explicitly so a future default flip can't break it.
    ALLOW_DATA_ATTR: true,
    // The CKEditor `link` plugin's "open in new tab" — DOMPurify drops `target`
    // by default. The afterSanitizeAttributes hook adds rel="noopener noreferrer".
    ADD_ATTR: ["target"],
    // No author-supplied <style> blocks; its text content is dropped too (style is
    // in DOMPurify's default FORBID_CONTENTS). Inline `style` attributes are kept.
    FORBID_TAGS: ["style"]
};

let hooksRegistered = false;

function registerHooks(): void {
    if (hooksRegistered) {
        return;
    }
    hooksRegistered = true;

    DOMPurify.addHook("afterSanitizeAttributes", node => {
        if (!(node instanceof Element)) {
            return;
        }
        // Reverse-tabnabbing: any link opening a new tab gets rel="noopener noreferrer".
        if (node.nodeName === "A" && node.getAttribute("target") === "_blank") {
            node.setAttribute("rel", "noopener noreferrer");
        }
        // Base64 paste can only produce raster images; a data:image/svg+xml src
        // would carry scripts. Strip any non-raster data: URI on <img>.
        if (node.nodeName === "IMG") {
            const src = node.getAttribute("src") ?? "";
            if (/^data:/i.test(src) && !RASTER_DATA_URI.test(src)) {
                node.removeAttribute("src");
            }
        }
    });
}

/**
 * Sanitize stored rich-text HTML for rendering. Returns the input unchanged when
 * empty. Call AFTER `migrateStoredValue()`.
 */
export function sanitizeRichText(html: string): string {
    if (!html) {
        return html;
    }
    registerHooks();
    return DOMPurify.sanitize(html, BASE_CONFIG);
}
