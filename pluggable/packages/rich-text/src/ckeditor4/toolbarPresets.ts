/**
 * CKEditor 4 toolbar configurations. Button names follow the CKEditor 4
 * convention (see https://ckeditor.com/docs/ckeditor4/latest/features/toolbar.html).
 * "mendixlink" is contributed by the bundled MendixLink plugin.
 */

export type ToolbarPreset = "basic" | "standard" | "full" | "custom";

export type CKEditor4Toolbar = Array<string[] | "/">;

const BASIC: CKEditor4Toolbar = [
    ["Bold", "Italic"],
    ["NumberedList", "BulletedList"],
    ["Link", "Unlink", "mendixlink"],
    ["Undo", "Redo"]
];

const STANDARD: CKEditor4Toolbar = [
    ["Format"],
    ["Bold", "Italic", "Underline", "Strike", "RemoveFormat"],
    ["NumberedList", "BulletedList", "Outdent", "Indent"],
    ["Link", "Unlink", "mendixlink"],
    ["Blockquote", "Table"],
    "/",
    ["Undo", "Redo"],
    ["Source"]
];

const FULL: CKEditor4Toolbar = [
    ["Styles", "Format", "Font", "FontSize"],
    ["Bold", "Italic", "Underline", "Strike", "Subscript", "Superscript", "RemoveFormat"],
    ["TextColor", "BGColor"],
    "/",
    ["NumberedList", "BulletedList", "Outdent", "Indent"],
    ["JustifyLeft", "JustifyCenter", "JustifyRight", "JustifyBlock"],
    ["Link", "Unlink", "Anchor", "mendixlink"],
    ["Image", "Table", "HorizontalRule", "SpecialChar", "Iframe"],
    "/",
    ["Maximize", "ShowBlocks", "Source"],
    ["Undo", "Redo"],
    ["Find", "Replace", "-", "SelectAll"]
];

export function resolveToolbar(preset: ToolbarPreset, custom?: string): CKEditor4Toolbar {
    if (preset === "custom" && custom?.trim()) {
        // Each comma-separated token becomes a button; "|" starts a new group, "/" a new row.
        const groups: CKEditor4Toolbar = [];
        let current: string[] = [];
        const flush = (): void => {
            if (current.length) {
                groups.push(current);
                current = [];
            }
        };
        for (const raw of custom.split(",").map(s => s.trim())) {
            if (!raw) {
                continue;
            }
            if (raw === "/") {
                flush();
                groups.push("/");
            } else if (raw === "|") {
                flush();
            } else {
                current.push(raw);
            }
        }
        flush();
        return groups;
    }

    switch (preset) {
        case "basic":
            return BASIC;
        case "full":
            return FULL;
        case "standard":
        default:
            return STANDARD;
    }
}
