# CKEditor for Mendix — pluggable widgets (React + CKEditor 4)

**Branch `ckeditor4-react`** — the CKEditor **4.22.0** variant of the rewrite (`react-ver` is the CKEditor 5 variant).
Same shared package, viewer widget, workspace, and build tooling; only the editor engine differs.

Why: CKEditor 4.22.0 is tri-licensed GPL-2.0 / LGPL-2.1 / MPL-1.1, so it can be used in a proprietary Mendix app with no
licence key — unlike CKEditor 5 (GPL + mandatory key). Trade-off: CKEditor 4 open source is EOL since June 2023 (no
security patches). See [`MIGRATION.md`](./MIGRATION.md) for the full rationale, property mapping, and wire format.

The editor is **not bundled** — `ckeditor.js` (4.22.0 "standard-all") is loaded at runtime from
`https://cdn.ckeditor.com/4.22.0/standard-all/ckeditor.js` by default, or from the URL set in the widget's **Editor
script URL** property (host `node_modules/ckeditor4/` inside your app for offline use). `.mpk` is ~52 KB.

## Layout (npm workspaces)

| Package                     | What                                                                                                                                                             |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/shared`           | Framework-agnostic logic: microflow-link parsing/serialization, image-URL resolution, toolbar presets, the `RichTextView` renderer. Plain `tsc` build → `dist/`. |
| `packages/rich-text`        | The **editor** widget (`ckeditorformendix.richtext.RichText`). CKEditor 4.22.0 (runtime `<script>`) + the `mendixlink` plugin (`src/ckeditor4/`).                |
| `packages/rich-text-viewer` | The **viewer** widget (`ckeditorformendix.richtextviewer.RichTextViewer`). Renders stored HTML, executes microflow links on click.                               |

## Commands

Run from `pluggable/`:

```bash
npm install
npm run build            # build shared, then both widget .mpk files
npm test                 # shared unit tests
npm run lint             # prettier + eslint across packages

npm run dev:editor       # pluggable-widgets-tools dev server for the editor widget
npm run dev:viewer       # …for the viewer widget
```

`shared` must be built before the widgets (its `dist/` is what the widget bundlers consume). `npm run build` /
`npm install` (via its `prepare` script) both do this.

Widget `.mpk` output lands in `packages/<widget>/dist/<version>/`.

### Dev server / test project

`packages/*/package.json` → `config.projectPath` points at `../../tests/testProject`, which is not committed. To use
`npm run dev:*`, create a Mendix test app there (or change the path) — it is only needed for the live-reload dev server,
not for `build`.

## Status

Phase 1 (scaffold + green build) and the core of phase 2 (microflow links) are in place. Not yet ported: code snippet /
character count (need a "full" CKEditor build), image handling, self-hosted asset bundling. See `MIGRATION.md`.

## Licensing note

CKEditor **4.22.0** is tri-licensed GPL-2.0 / LGPL-2.1 / MPL-1.1 (confirmed in `node_modules/ckeditor4/package.json`).
Under LGPL/MPL it can ship inside a proprietary Mendix app with no licence key, so `rich-text` stays `Apache-2.0`. But
4.22.0 is EOL — no security patches. `4.23.0+` ("CKEditor 4 LTS") is paid/commercial; do not upgrade past 4.22.0 on this
branch.
