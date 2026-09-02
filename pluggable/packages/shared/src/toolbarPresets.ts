/**
 * CKEditor 5 toolbar item names differ from CKEditor 4's. These presets map the
 * old widget's toolbar-group booleans onto sensible CKEditor 5 configurations.
 * "mendixLink" is the custom button contributed by the MendixLink plugin.
 */

export type ToolbarPreset = "basic" | "standard" | "full" | "custom";

const BASIC: string[] = [
    "bold",
    "italic",
    "|",
    "link",
    "mendixLink",
    "|",
    "bulletedList",
    "numberedList",
    "|",
    "undo",
    "redo"
];

const STANDARD: string[] = [
    "heading",
    "|",
    "bold",
    "italic",
    "underline",
    "strikethrough",
    "|",
    "link",
    "mendixLink",
    "|",
    "bulletedList",
    "numberedList",
    "outdent",
    "indent",
    "|",
    "blockQuote",
    "insertTable",
    "|",
    "undo",
    "redo"
];

const FULL: string[] = [
    "heading",
    "|",
    "fontFamily",
    "fontSize",
    "fontColor",
    "fontBackgroundColor",
    "|",
    "bold",
    "italic",
    "underline",
    "strikethrough",
    "subscript",
    "superscript",
    "removeFormat",
    "|",
    "link",
    "mendixLink",
    "|",
    "bulletedList",
    "numberedList",
    "todoList",
    "outdent",
    "indent",
    "alignment",
    "|",
    "blockQuote",
    "insertTable",
    "mediaEmbed",
    "horizontalLine",
    "specialCharacters",
    "|",
    "sourceEditing",
    "|",
    "undo",
    "redo"
];

export function resolveToolbar(preset: ToolbarPreset, custom?: string): string[] {
    if (preset === "custom") {
        return (custom ?? "")
            .split(",")
            .map(item => item.trim())
            .filter(Boolean);
    }
    switch (preset) {
        case "basic":
            return [...BASIC];
        case "full":
            return [...FULL];
        case "standard":
        default:
            return [...STANDARD];
    }
}
