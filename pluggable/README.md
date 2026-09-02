# CKEditor for Mendix — pluggable widgets (React + CKEditor 5)

React/TypeScript rewrite of the legacy Dojo `CKEditorForMendix` widgets, built with `@mendix/pluggable-widgets-tools`.
See [`MIGRATION.md`](./MIGRATION.md) for the plan, property mapping, and the microflow-link wire format.

## Layout (npm workspaces)

| Package                     | What                                                                                                                                                             |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/shared`           | Framework-agnostic logic: microflow-link parsing/serialization, image-URL resolution, toolbar presets, the `RichTextView` renderer. Plain `tsc` build → `dist/`. |
| `packages/rich-text`        | The **editor** widget (`ckeditorformendix.richtext.RichText`). CKEditor 5 + the `MendixLink` plugin.                                                             |
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

Phase 1 (scaffold + green build) and the core of phase 2 (microflow links) are in place. Not yet ported: image
upload/base64 handling, media embed polish, line-clamp tuning, full toolbar-preset parity, editor character-count UI.
See `MIGRATION.md`.

## Licensing note

CKEditor 5 open source is GPL-2.0+. The `rich-text` package is marked `GPL-2.0-or-later` and starts CKEditor with
`licenseKey: "GPL"`. The original repo is Apache-2.0 — resolve this (commercial CKEditor license, or accept GPL for the
editor widget) before any Marketplace release.
