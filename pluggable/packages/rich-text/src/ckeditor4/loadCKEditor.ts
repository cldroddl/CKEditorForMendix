/**
 * Loads the CKEditor 4 script exactly once and resolves with the global
 * `window.CKEDITOR`. CKEditor 4's `ckeditor.js` is a pre-built IIFE that loads
 * its own plugins/skins/lang relative to `CKEDITOR.basePath`, so it must be
 * loaded as an external script rather than bundled.
 *
 * Default URL is the "full-all" preset of the last open-source (LGPL/MPL) build,
 * 4.22.0, from the CKEditor CDN — matching the legacy widget's vendored build
 * (`preset: 'full'` + extras). For offline apps or to avoid the external request,
 * host a full CKEditor 4.22.0 build inside your Mendix app
 * (e.g. `theme/web/ckeditor/`) and point the widget's "Editor script URL" at it.
 */

export const DEFAULT_CKEDITOR_URL = "https://cdn.ckeditor.com/4.22.0/full-all/ckeditor.js";

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

export function loadCKEditor(url: string = DEFAULT_CKEDITOR_URL): Promise<CKEditorGlobal> {
    if (window.CKEDITOR) {
        return Promise.resolve(window.CKEDITOR);
    }
    if (pending) {
        if (loadedFrom && loadedFrom !== url) {
            // CKEditor 4 is a global singleton — a second URL cannot be honoured.
            // eslint-disable-next-line no-console
            console.warn(`CKEditor 4 already loading from ${loadedFrom}; ignoring ${url}`);
        }
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
                resolve(window.CKEDITOR);
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
