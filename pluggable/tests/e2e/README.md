# End-to-end tests

Drive a **running Mendix app** that hosts both widgets. Unlike the component tests
(`npm run test:ct`), these exercise the real client — microflow execution,
attribute round-trip, the viewer resolving links against real bindings.

Not run by `npm test` or CI — they need a Mendix runtime.

## Setup

1. Build the widgets and get them into the test project:

   ```
   npm run build            # from pluggable/
   ```

   `dist/*` is copied into `tests/testProject/widgets/` automatically.

2. Open `tests/testProject` in **Mendix Studio Pro** (11.6+). Configure the
   microflow-link wiring by hand (mxcli can't write widget object-lists — see
   `tests/testProject/mdlsource/setup.mdl`):

   - **viewer1** → _Microflow links_: one row, Link Name = `Beta`, Microflow =
     `MyFirstModule.NAV_LinkClicked`.
   - **editorA** → _Microflow links_: one row, Link Name = `Beta` (name only) so
     the "Insert Mendix link" dialog can insert it.
   - Give `NAV_LinkClicked` a visible activity (Show message) if you want the
     click assertion to check UI rather than the console.

3. Run the app (Studio Pro _Run_, or `mx` CLI). It should serve at
   `http://localhost:8080` — override with `MX_APP_URL`.

4. If the app requires login, set `MX_USER` / `MX_PASSWORD` and the specs will
   sign in; otherwise they assume anonymous access to the test page.

## Run

```
npm run test:e2e                         # from pluggable/
MX_APP_URL=http://localhost:8080 npm run test:e2e
npm run test:e2e -- --headed             # watch it
```

## What the specs cover

`rich-text.e2e.ts`:

- the editor mounts (CKEditor toolbar visible) and the viewer renders the same
  stored value
- typing in the editor updates the bound attribute and the viewer reflects it
- clicking a microflow link in the viewer fires its microflow

These are a starting point — extend as the widget grows (image upload, custom
toolbars, multiple widgets on one page).
