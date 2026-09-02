/**
 * Wire-compatible handling of "microflow link" anchors stored in the rich-text
 * attribute value.
 *
 * Two on-disk formats are supported:
 *
 *  - Legacy (Dojo widget):
 *      <a href="__LINK__"
 *         class="btn ... mx-microflow-link"
 *         onclick="CKEditorViewer.mf.exec('MyFn', '__ID__', '__GUID__');"
 *         title="...">Label</a>
 *
 *  - New (this widget):
 *      <a href="#" class="btn ... mx-microflow-link" data-mf="MyFn">Label</a>
 *
 * The viewer normalises both to a `MicroflowLinkRef` and re-attaches behaviour in
 * React. The editor only ever writes the new format; the legacy format is kept
 * readable so existing app content is not broken.
 */

export const MICROFLOW_LINK_CLASS = "mx-microflow-link";

const LEGACY_ONCLICK_RE = /CKEditorViewer\.mf\.exec\(\s*['"]([^'"]+)['"]/i;

export interface MicroflowLinkRef {
    /** The `functionName` / link name that maps to a configured action. */
    functionName: string;
    /** Whether the anchor used the legacy inline-onclick format. */
    legacy: boolean;
}

/** Read the microflow function name off an anchor element, or null if it isn't one. */
export function readMicroflowLink(anchor: Element): MicroflowLinkRef | null {
    if (!anchor.classList.contains(MICROFLOW_LINK_CLASS)) {
        return null;
    }

    const dataMf = anchor.getAttribute("data-mf");
    if (dataMf) {
        return { functionName: dataMf, legacy: false };
    }

    const onclick = anchor.getAttribute("onclick");
    if (onclick) {
        const match = LEGACY_ONCLICK_RE.exec(onclick);
        if (match) {
            return { functionName: match[1], legacy: true };
        }
    }

    return null;
}

/**
 * Strip the inline `onclick` / placeholder tokens from a legacy anchor and move
 * the function name to `data-mf`, so the rendered DOM carries no inline JS.
 * Mutates and returns the passed element.
 */
export function sanitizeLegacyAnchor(anchor: Element): Element {
    const ref = readMicroflowLink(anchor);
    if (ref) {
        anchor.setAttribute("data-mf", ref.functionName);
    }
    anchor.removeAttribute("onclick");
    const href = anchor.getAttribute("href");
    if (!href || href.indexOf("__LINK__") !== -1) {
        anchor.setAttribute("href", "#");
    }
    return anchor;
}

/** Build the anchor markup the editor persists for a new microflow link. */
export function serializeMicroflowLink(opts: {
    functionName: string;
    label: string;
    cssClasses?: string;
    title?: string;
}): string {
    const classes = [opts.cssClasses?.trim(), MICROFLOW_LINK_CLASS].filter(Boolean).join(" ");
    const attrs: string[] = [
        `href="#"`,
        `class="${escapeAttr(classes)}"`,
        `data-mf="${escapeAttr(opts.functionName)}"`
    ];
    if (opts.title) {
        attrs.push(`title="${escapeAttr(opts.title)}"`);
    }
    return `<a ${attrs.join(" ")}>${escapeText(opts.label)}</a>`;
}

/**
 * One-shot migration of a stored attribute value: rewrite every legacy
 * microflow-link anchor to the new format. Returns the value unchanged when
 * there is nothing to migrate. Runs in the DOM, so call it in the browser only.
 */
export function migrateStoredValue(html: string): string {
    if (!html || html.indexOf(MICROFLOW_LINK_CLASS) === -1 || html.indexOf("CKEditorViewer.mf.exec") === -1) {
        return html;
    }
    const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
    doc.body.querySelectorAll(`a.${MICROFLOW_LINK_CLASS}`).forEach(sanitizeLegacyAnchor);
    return doc.body.innerHTML;
}

function escapeAttr(value: string): string {
    return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeText(value: string): string {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
