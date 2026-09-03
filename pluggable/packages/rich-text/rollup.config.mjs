/**
 * Custom rollup config for the RichText widget.
 *
 * `@mendix/pluggable-widgets-tools` loads this file if present and passes its own
 * generated config array as `args.configDefaultConfig`. We prepend one plugin to
 * every config that copies a full CKEditor 4.22.0 runtime tree into the widget's
 * `assets/ckeditor/` folder before pwt zips the `.mpk`. The widget then loads
 * `ckeditor.js` from its own deployed assets — same origin, no CDN, works offline
 * (the legacy Dojo widget vendored CKEditor the same way).
 *
 * Sources (dev dependencies, pinned in the lockfile — nothing vendored in git):
 *   - `ckeditor4@4.22.0`               — last open-source (GPL-2.0 / LGPL-2.1 / MPL-1.1) release
 *   - `ckeditor-wordcount-plugin`      — MIT, the `wordcount` plugin (not in the CKEditor package)
 */
import { createRequire } from "node:module";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const packageRoot = dirname(fileURLToPath(import.meta.url));

const ckeditorRoot = dirname(require.resolve("ckeditor4/ckeditor.js"));
const wordcountPluginDir = join(dirname(require.resolve("ckeditor-wordcount-plugin/package.json")), "wordcount");

// The pwt output layout: dist/tmp/widgets/<packagePath>/<widgetname>/assets/…
const assetsCKEditorDir = join(packageRoot, "dist/tmp/widgets/ckeditorformendix/richtext/assets/ckeditor");

// Only the files CKEditor needs at runtime — skips samples/, adapters/, tests, dev tooling.
// `moono-lisa` is the skin `ckeditor.js` defaults to; the other two skins are dropped.
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
