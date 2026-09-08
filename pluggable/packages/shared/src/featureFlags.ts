/**
 * Build-time feature flags for the widget distributor.
 *
 * Flip a value here and run `npm run build` — `shared` compiles first, then both
 * widgets pick up the new value. These are NOT app-developer or end-user settings;
 * they decide what the distributed `.mpk` exposes.
 */

/**
 * Microflow links — the editor's "Insert a Mendix microflow link" toolbar button
 * and the **Microflow links** property group on both widgets' settings.
 *
 * `false` → the property group is hidden in Studio Pro (app developers never see
 * it) and the editor doesn't load the `mendixlink` plugin / show its button.
 * Stored content that already uses microflow-link anchors still renders as plain
 * links.
 */
export const MICROFLOW_LINKS_ENABLED = true;
