/**
 * Loads the CKEditor 4 script exactly once and resolves with the global
 * `window.CKEDITOR`. CKEditor 4's `ckeditor.js` is a pre-built IIFE that loads
 * its own plugins/skins/lang relative to `CKEDITOR.basePath`, so it must be
 * loaded as an external script rather than bundled.
 *
 * The widget's build bundles a CKEditor 4.22.0 runtime into its own
 * `assets/ckeditor/` (see `rollup.config.mjs`), so by default it loads from
 * `<app>/widgets/ckeditorformendix/richtext/assets/ckeditor/ckeditor.js` — same
 * origin, no external request, offline-safe, like the legacy vendored widget.
 * The bundled files are stamped with a fixed mtime so a rebuilt `.mpk` is
 * byte-identical and Studio Pro's incremental deploy skips re-extracting them
 * (avoids the Windows "file in use" lock on `editor.css`).
 */

/** The CDN build — a valid override value for "Editor script URL", not the default. */
export const CDN_CKEDITOR_URL = "https://cdn.ckeditor.com/4.22.0/full-all/ckeditor.js";

/** Where the widget build drops the bundled CKEditor, relative to the app root. */
const BUNDLED_PATH = "widgets/ckeditorformendix/richtext/assets/ckeditor/ckeditor.js";

interface MxRuntime {
    remoteUrl?: string;
    appUrl?: string;
}

function appRoot(): string {
    const mx = (window as unknown as { mx?: MxRuntime }).mx;
    return (mx?.remoteUrl ?? mx?.appUrl ?? "/").replace(/\/?$/, "/");
}

/**
 * Turn the widget's "Editor script URL" value into an absolute URL:
 * empty -> the bundled copy; an absolute URL -> unchanged; anything else ->
 * resolved against the app root.
 */
export function resolveScriptUrl(raw: string | undefined): string {
    const value = raw?.trim();
    if (!value) {
        return appRoot() + BUNDLED_PATH;
    }
    if (/^(https?:)?\/\//i.test(value)) {
        return value;
    }
    return appRoot() + value.replace(/^\//, "");
}

interface CKEditorGlobal {
    replace(el: HTMLElement | string, config?: Record<string, unknown>): CKEditorInstance | null;
    inline(el: HTMLElement | string, config?: Record<string, unknown>): CKEditorInstance | null;
    instances: Record<string, CKEditorInstance | undefined>;
    on(event: string, listener: () => void): void;
    status: string;
    plugins: {
        registered: Record<string, unknown>;
        add(name: string, def: Record<string, unknown>): void;
        addExternal(name: string, path: string, fileName?: string): void;
    };
    dialog: { add(name: string, fn: unknown): void };
    dialogCommand: new (name: string) => unknown;
    config: Record<string, unknown>;
    TRISTATE_OFF: number;
}

export interface CKEditorInstance {
    name: string;
    status: string;
    getData(): string;
    setData(data: string, options?: Record<string, unknown>): void;
    setReadOnly(readOnly: boolean): void;
    destroy(noUpdate?: boolean): void;
    on(event: string, listener: (evt: unknown) => void): void;
    config: Record<string, unknown>;
}

declare global {
    interface Window {
        CKEDITOR?: CKEditorGlobal;
        CKEDITOR_BASEPATH?: string;
    }
}

let pending: Promise<CKEditorGlobal> | null = null;
let loadedFrom: string | null = null;

function warnUrlMismatch(url: string): void {
    if (loadedFrom && loadedFrom !== url) {
        // CKEditor 4 is a page-global singleton — one <script> per page. A RichText widget
        // configured with a different "Editor script URL" cannot get its own build.
        // eslint-disable-next-line no-console
        console.error(
            `CKEditor 4 is already loaded from ${loadedFrom}. Ignoring ${url} — all RichText widgets ` +
                `on a page share one CKEditor build. Set the same "Editor script URL" on every RichText widget.`
        );
    }
}

/**
 * Global CKEditor config applied once, before any instance is created. CKEditor
 * 4.22+ turns on a "this version is not secure" console error + notification for
 * non-LTS builds; we ship a deliberately pinned 4.22.x, so silence it globally
 * (the per-instance `versionCheck: false` in Editor.tsx is not always honoured
 * because the check is wired on a global `instanceReady` listener).
 */
function applyGlobalConfig(CKEDITOR: CKEditorGlobal): CKEditorGlobal {
    CKEDITOR.config.versionCheck = false;
    return CKEDITOR;
}

export function loadCKEditor(url: string = resolveScriptUrl(undefined)): Promise<CKEditorGlobal> {
    if (window.CKEDITOR) {
        warnUrlMismatch(url);
        return Promise.resolve(applyGlobalConfig(window.CKEDITOR));
    }
    if (pending) {
        warnUrlMismatch(url);
        return pending;
    }

    loadedFrom = url;
    // Derive basePath from the script URL so CKEditor finds its own assets.
    const basePath = url.replace(/[^/]+$/, "");
    if (!window.CKEDITOR_BASEPATH) {
        window.CKEDITOR_BASEPATH = basePath;
    }

    pending = new Promise<CKEditorGlobal>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = url;
        script.async = true;
        script.onload = () => {
            if (window.CKEDITOR) {
                resolve(applyGlobalConfig(window.CKEDITOR));
            } else {
                reject(new Error("CKEditor 4 script loaded but window.CKEDITOR is undefined"));
            }
        };
        script.onerror = () => reject(new Error(`Failed to load CKEditor 4 from ${url}`));
        document.head.appendChild(script);
    }).catch(err => {
        // Don't cache the rejection — allow a retry on the next mount.
        pending = null;
        loadedFrom = null;
        throw err;
    });

    return pending;
}
