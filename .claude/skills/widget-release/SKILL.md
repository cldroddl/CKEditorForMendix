---
name: widget-release
description: Cut a new release of the CKEditorForMendix widget — bump the version, rebuild the .mpk, and update version-bearing files. User-triggered only; takes the new version as an argument (e.g. /widget-release 2.5.3).
disable-model-invocation: true
---

Release a new version of the widget. The target version is `$ARGUMENTS` (semver, e.g. `2.5.3`). If it is missing or not `MAJOR.MINOR.PATCH`, ask for it before doing anything.

Steps:

1. **Preconditions**
   - Working tree is clean (`git status --porcelain`). If not, stop and report.
   - You are on a release branch, not `master` (per CLAUDE.md, changes go via PR). If on `master`, create `release/$ARGUMENTS` first.
   - `node_modules/` exists. If not, run `npm install` (needs network for the `widgetbuilder-gulp-helper` GitHub tarball).

2. **Bump the version**
   - Run `npm run version -- -n $ARGUMENTS`.
   - Confirm it updated `src/package.xml` and `package.json`.
   - Check `src/CKEditorForMendix/CKEditorForMendix.xml` and `CKEditorViewerForMendix.xml` for a hardcoded version string and update if present.
   - Update the version in `README.md` if it mentions one.

3. **Build**
   - Run `npm run build`.
   - Confirm `dist/CKEditorForMendix.mpk` and `test/widgets/CKEditorForMendix.mpk` were regenerated (check timestamps).

4. **Stage deliberately**
   - Stage the version files AND the rebuilt `.mpk` artifacts (a release is the one time `.mpk` files are committed — see CLAUDE.md).
   - Show the user `git diff --cached --stat` and the full diff of non-`.mpk` files.

5. **Hand off**
   - Do not commit or push unless the user says to.
   - Remind the user that distribution is a manual upload of `dist/CKEditorForMendix.mpk` to the Mendix Marketplace.
