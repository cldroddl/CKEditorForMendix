/**
 * Custom rollup config for the RichText widget.
 *
 * `@mendix/pluggable-widgets-tools` loads this file if present and passes its own
 * generated config array as `args.configDefaultConfig`. We prepend one plugin to
 * every config that copies a CKEditor 4.22.0 runtime into the widget's
 * `assets/ckeditor/` before pwt zips the `.mpk`, so the widget is self-contained
 * (drop the `.mpk` in `widgets/` — nothing else to install) and works offline.
 *
 * Every copied file is stamped with a FIXED mtime. That makes a rebuilt `.mpk`
 * byte-identical to the last one, so Studio Pro's incremental deploy skips
 * re-extracting the ~3000 CKEditor files on each `Run` — which is what trips the
 * Windows "file is in use" lock on `editor.css` while the app/browser holds it
 * open. (The legacy Dojo widget avoided the lock the same way, incidentally: its
 * vendored `.mpk` was a frozen committed artifact with stable timestamps.)
 * Bump `FROZEN_MTIME` whenever the pinned CKEditor version changes.
 *
 * Sources — dev dependencies pinned in the lockfile, nothing vendored in git:
 *   ckeditor4@4.22.0            last open-source release (GPL-2.0 / LGPL-2.1 / MPL-1.1)
 *   ckeditor-wordcount-plugin   MIT — `wordcount` is not in the CKEditor package
 */
import { createRequire } from "node:module";
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, utimesSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const packageRoot = dirname(fileURLToPath(import.meta.url));

const ckeditorRoot = dirname(require.resolve("ckeditor4/ckeditor.js"));
const wordcountPluginDir = join(dirname(require.resolve("ckeditor-wordcount-plugin/package.json")), "wordcount");

// The pwt output layout: dist/tmp/widgets/<packagePath>/<widgetname>/assets/…
const assetsCKEditorDir = join(packageRoot, "dist/tmp/widgets/ckeditorformendix/richtext/assets/ckeditor");

const FROZEN_MTIME = new Date("2023-06-28T00:00:00Z"); // CKEditor 4.22.0 release; bump with the version

// Only the files CKEditor needs at runtime — no samples/, no dev tooling, one skin.
const CKEDITOR_RUNTIME_ENTRIES = [
    "ckeditor.js",
    "config.js",
    "contents.css",
    "styles.js",
    "LICENSE.md",
    "skins/moono-lisa",
    "plugins",
    "lang",
    "vendor"
];

const skipDevDirs = src => !/[/\\](samples|dev|tests|\.github)([/\\]|$)/.test(src);

function freezeTimestamps(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            freezeTimestamps(full);
        }
        utimesSync(full, FROZEN_MTIME, FROZEN_MTIME);
    }
}

function bundleCKEditor() {
    let copied = false;
    return {
        name: "bundle-ckeditor",
        writeBundle() {
            if (copied) {
                return;
            }
            copied = true;

            rmSync(assetsCKEditorDir, { recursive: true, force: true });
            mkdirSync(join(assetsCKEditorDir, "skins"), { recursive: true });

            for (const entry of CKEDITOR_RUNTIME_ENTRIES) {
                const from = join(ckeditorRoot, entry);
                if (existsSync(from)) {
                    cpSync(from, join(assetsCKEditorDir, entry), { recursive: true, filter: skipDevDirs });
                }
            }
            // wordcount is a separate MIT package; drop it next to the other plugins.
            cpSync(wordcountPluginDir, join(assetsCKEditorDir, "plugins/wordcount"), {
                recursive: true,
                filter: skipDevDirs
            });

            if (statSync(assetsCKEditorDir).isDirectory()) {
                freezeTimestamps(assetsCKEditorDir);
                utimesSync(assetsCKEditorDir, FROZEN_MTIME, FROZEN_MTIME);
            }
        }
    };
}

export default args => {
    const configs = args.configDefaultConfig;
    for (const config of configs) {
        config.plugins = [bundleCKEditor(), ...(config.plugins ?? [])];
    }
    return configs;
};
