/**
 * CKEditor 4 toolbar construction, ported 1:1 from the legacy Dojo widget's
 * `_addToolbars` / `_buildCustomToolbars`
 * (`src/CKEditorForMendix/widget/CKEditorForMendix.js`).
 *
 * - The 14 `toolbar*` booleans (Document group) map to CKEditor 4 `config.toolbarGroups`.
 * - `useCustomToolbar` + the `customToolbars` object-list map to `config.toolbar`.
 *
 * The `mendixlink` button is contributed by the MendixLink plugin with
 * `toolbar: "links"`, so it appears in the links group automatically when
 * `toolbarLinks` is enabled — same as the legacy widget.
 */

export interface ToolbarBooleans {
    toolbarDocument: boolean;
    toolbarClipboard: boolean;
    toolbarEditing: boolean;
    toolbarForms: boolean;
    toolbarSeperator1: boolean;
    toolbarBasicstyles: boolean;
    toolbarParagraph: boolean;
    toolbarLinks: boolean;
    toolbarInsert: boolean;
    toolbarSeperator2: boolean;
    toolbarStyles: boolean;
    toolbarColors: boolean;
    toolbarTools: boolean;
    toolbarOthers: boolean;
}

export interface CustomToolbarItem {
    ctItemType: string;
    ctItemToolbar: string;
}

type ToolbarGroup = { name: string; groups?: string[] } | "/";

export function buildToolbarGroups(b: ToolbarBooleans): ToolbarGroup[] {
    const groups: ToolbarGroup[] = [];
    const push = (group: ToolbarGroup, predicate: boolean): void => {
        if (predicate) {
            groups.push(group);
        }
    };

    push({ name: "document", groups: ["mode", "document", "doctools"] }, b.toolbarDocument);
    push({ name: "clipboard", groups: ["clipboard", "undo"] }, b.toolbarClipboard);
    push({ name: "editing", groups: ["find", "selection", "spellchecker"] }, b.toolbarEditing);
    push({ name: "forms" }, b.toolbarForms);
    push("/", b.toolbarSeperator1);
    push({ name: "basicstyles", groups: ["basicstyles", "cleanup"] }, b.toolbarBasicstyles);
    push({ name: "paragraph", groups: ["list", "indent", "blocks", "align", "bidi"] }, b.toolbarParagraph);
    push({ name: "links" }, b.toolbarLinks);
    push({ name: "insert" }, b.toolbarInsert);
    push("/", b.toolbarSeperator2);
    push({ name: "styles" }, b.toolbarStyles);
    push({ name: "colors" }, b.toolbarColors);
    push({ name: "tools" }, b.toolbarTools);
    push({ name: "others" }, b.toolbarOthers);

    return groups;
}

export function buildCustomToolbar(items: CustomToolbarItem[]): Array<{ name: string; items: string[] }> {
    const byToolbar: Record<string, string[]> = {};
    for (const item of items) {
        const id = item.ctItemToolbar;
        const type = item.ctItemType !== "seperator" ? item.ctItemType : "-";
        (byToolbar[id] ??= []).push(type);
    }
    return Object.keys(byToolbar).map(name => ({ name, items: byToolbar[name] }));
}
