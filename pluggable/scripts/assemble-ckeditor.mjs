/**
 * Assembles a self-hosted CKEditor 4.22.0 runtime for the RichText widget.
 *
 *   npm run assemble-ckeditor            -> writes ./ckeditor-dist/ckeditor/
 *   npm run assemble-ckeditor -- <dir>   -> writes <dir>/ckeditor/
 *                                          (e.g. path/to/YourApp/theme/web)
 *
 * Copy the resulting `ckeditor/` folder into your Mendix app's `theme/web/`.
 * The RichText widget then loads it from `<app>/ckeditor/ckeditor.js` — no CDN,
 * no external request, offline-safe. These files change only when the pinned
 * `ckeditor4` / `ckeditor-wordcount-plugin` versions change, so Studio Pro's
 * theme sync copies them once and leaves them alone (unlike a widget `.mpk`,
 * which is re-extracted on every deploy and locks files on Windows).
 *
 * Sources — dev dependencies pinned in the lockfile, nothing vendored in git:
 *   ckeditor4@4.22.0            last open-source release (GPL-2.0 / LGPL-2.1 / MPL-1.1)
 *   ckeditor-wordcount-plugin   MIT — `wordcount` is not in the CKEditor package
 */
import { createRequire } from "node:module";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const require = createRequire(import.meta.url);
const ckeditorRoot = dirname(require.resolve("ckeditor4/ckeditor.js"));
const wordcountDir = join(dirname(require.resolve("ckeditor-wordcount-plugin/package.json")), "wordcount");

const targetBase = process.argv[2] ? resolve(process.argv[2]) : resolve("ckeditor-dist");
const outDir = join(targetBase, "ckeditor");

// Everything CKEditor needs at runtime; skip samples/, dev tooling, extra skins.
const ENTRIES = [
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

rmSync(outDir, { recursive: true, force: true });
mkdirSync(join(outDir, "skins"), { recursive: true });

for (const entry of ENTRIES) {
    const from = join(ckeditorRoot, entry);
    if (existsSync(from)) {
        cpSync(from, join(outDir, entry), { recursive: true, filter: skipDevDirs });
    }
}
cpSync(wordcountDir, join(outDir, "plugins/wordcount"), { recursive: true, filter: skipDevDirs });

console.log(`\nCKEditor 4.22.0 runtime assembled at:\n  ${outDir}\n`);
console.log("Next: copy that `ckeditor` folder into your Mendix app's `theme/web/` so it");
console.log('deploys to `<app>/ckeditor/`. In Studio Pro the widget\'s "Editor script URL"');
console.log("is read-only and already points there.\n");
