/**
 * Custom rollup config for the RichText widget.
 *
 * `@mendix/pluggable-widgets-tools` loads this file if present and passes its own
 * generated config array as `args.configDefaultConfig`. We prepend a plugin to
 * every config that copies a CKEditor 4.22.0 runtime into the widget's
 * `assets/ckeditor/` before pwt zips the `.mpk`, so the widget is self-contained
 * (drop the `.mpk` in `widgets/` — nothing else to install) and works offline.
 * A module-scope guard runs the copy ONCE per build, not once per output config.
 *
 * On Windows the delete/copy/utimes calls retry on `EBUSY`/`EPERM`: Windows
 * Defender and the Search indexer briefly lock files right after they are
 * written, which otherwise fails the build mid-run.
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

// The pwt output layout: dist/tmp/widgets/<packagePath>/<widgetname lowercased>/assets/…
const assetsCKEditorDir = join(
    packageRoot,
    "dist/tmp/widgets/ckeditor4formendix/ckeditorformendix/assets/ckeditor"
);

const FROZEN_MTIME = new Date("2023-06-28T00:00:00Z"); // CKEditor 4.22.0 release; bump with the version

// Only the files CKEditor needs at runtime — no samples/, no dev tooling, one skin,
// and locale files trimmed to KEEP_LANGS (see includeInBundle).
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

/**
 * CKEditor locale files to keep. CKEditor 4 ships a `lang/<xx>.js` for the core
 * plus one per plugin and per dialog (~2200 files, ~70 languages) and falls back
 * to `en` for any locale it can't load, so we bundle only the languages this
 * widget is deployed in. A widget dev deploying in another language adds its
 * ISO-639-1 code here and rebuilds. Matches any `lang/xx.js` / `lang/xx-yy.js`
 * in the tree (core lang, per-plugin lang, per-dialog lang, bundled wordcount);
 * non-JS locale assets such as the emoji `lang` JSON are left untouched.
 */
const KEEP_LANGS = new Set(["en", "ko"]);
const LANG_FILE_RE = /[/\\]lang[/\\]([a-z]{2}(?:-[a-z]+)?)\.js$/;

const includeInBundle = src => {
    if (/[/\\](samples|dev|tests|\.github)([/\\]|$)/.test(src)) {
        return false;
    }
    const lang = LANG_FILE_RE.exec(src);
    return !lang || KEEP_LANGS.has(lang[1]);
};

const LOCK_ERRORS = new Set(["EBUSY", "EPERM", "ENOTEMPTY", "EACCES"]);

const sleepSync = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

/** Retry a filesystem call that can transiently fail on Windows while an AV / indexer holds the file. */
function retryOnLock(fn, attempts = 6, delayMs = 200) {
    for (let i = 1; ; i++) {
        try {
            return fn();
        } catch (err) {
            if (i >= attempts || !LOCK_ERRORS.has(err.code)) {
                throw err;
            }
            sleepSync(delayMs);
        }
    }
}

function copyEntry(from, to) {
    retryOnLock(() => cpSync(from, to, { recursive: true, filter: includeInBundle }));
}

function freezeTimestamps(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            freezeTimestamps(full);
        }
        retryOnLock(() => utimesSync(full, FROZEN_MTIME, FROZEN_MTIME));
    }
}

// pwt instantiates the plugin once per output config (.js, .mjs, editorPreview,
// editorConfig). This guard is module scope, not a closure — so the copy runs
// ONCE per build, not 4×. The repeated runs were what raced Windows Defender /
// the search indexer scanning the freshly-written files → `EBUSY` on rm.
let bundled = false;

function bundleCKEditor() {
    return {
        name: "bundle-ckeditor",
        writeBundle() {
            if (bundled) {
                return;
            }
            bundled = true;

            retryOnLock(() =>
                rmSync(assetsCKEditorDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
            );
            mkdirSync(join(assetsCKEditorDir, "skins"), { recursive: true });

            for (const entry of CKEDITOR_RUNTIME_ENTRIES) {
                const from = join(ckeditorRoot, entry);
                if (existsSync(from)) {
                    copyEntry(from, join(assetsCKEditorDir, entry));
                }
            }
            // wordcount is a separate MIT package; drop it next to the other plugins.
            copyEntry(wordcountPluginDir, join(assetsCKEditorDir, "plugins/wordcount"));

            if (statSync(assetsCKEditorDir).isDirectory()) {
                freezeTimestamps(assetsCKEditorDir);
                retryOnLock(() => utimesSync(assetsCKEditorDir, FROZEN_MTIME, FROZEN_MTIME));
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
