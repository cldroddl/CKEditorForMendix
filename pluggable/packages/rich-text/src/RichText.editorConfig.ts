import { MICROFLOW_LINKS_ENABLED } from "@ckeditorformendix/shared";
import { RichTextPreviewProps } from "../typings/RichTextProps";

type Properties = PropertyGroup[];

interface PropertyGroup {
    caption: string;
    propertyGroups?: PropertyGroup[];
    properties?: Property[];
}

interface Property {
    key: string;
    caption: string;
    objectHeaders?: string[];
    settings?: object;
    readOnly?: boolean;
}

interface Problem {
    property?: string;
    severity?: "error" | "warning" | "deprecation";
    message: string;
}

export function getProperties(values: RichTextPreviewProps, defaultProperties: Properties): Properties {
    if (values.useCustomToolbar) {
        // The 14 Document toolbar toggles are ignored when a custom toolbar is used.
        [
            "toolbarDocument",
            "toolbarClipboard",
            "toolbarEditing",
            "toolbarForms",
            "toolbarSeperator1",
            "toolbarBasicstyles",
            "toolbarParagraph",
            "toolbarLinks",
            "toolbarInsert",
            "toolbarSeperator2",
            "toolbarStyles",
            "toolbarColors",
            "toolbarTools",
            "toolbarOthers"
        ].forEach(key => hideProperty(defaultProperties, key));
    } else {
        hideProperty(defaultProperties, "customToolbars");
    }
    if (!values.countPlugin) {
        hideProperty(defaultProperties, "countPluginMaxCount");
    }
    if (values.imagePasteMode !== "upload") {
        hideProperty(defaultProperties, "imageUploadMicroflow");
    }
    if (!values.showLabel) {
        hideProperty(defaultProperties, "fieldCaption");
    }
    // The script location is fixed (app's theme/web/ckeditor/); show it but don't let it be edited.
    setReadOnly(defaultProperties, "editorScriptUrl");

    if (!MICROFLOW_LINKS_ENABLED) {
        hideProperty(defaultProperties, "microflowLinks");
        removeEmptyGroup(defaultProperties, "Microflow links");
    }
    return defaultProperties;
}

export function check(values: RichTextPreviewProps): Problem[] {
    const problems: Problem[] = [];
    if (values.useCustomToolbar && values.customToolbars.length === 0) {
        problems.push({
            property: "customToolbars",
            message: "Use custom toolbar is enabled but no toolbar items are defined."
        });
    }
    values.microflowLinks.forEach((link, i) => {
        if (!link.functionNames?.trim()) {
            problems.push({
                property: `microflowLinks/${i + 1}/functionNames`,
                message: "Link Name is required."
            });
        }
    });
    return problems;
}

function hideProperty(groups: Properties, key: string): void {
    for (const group of groups) {
        if (group.properties) {
            group.properties = group.properties.filter(p => p.key !== key);
        }
        if (group.propertyGroups) {
            hideProperty(group.propertyGroups, key);
        }
    }
}

/** Drop a top-level property group once it has no visible properties left. */
function removeEmptyGroup(groups: Properties, caption: string): void {
    const idx = groups.findIndex(g => g.caption === caption && !g.properties?.length && !g.propertyGroups?.length);
    if (idx !== -1) {
        groups.splice(idx, 1);
    }
}

function setReadOnly(groups: Properties, key: string): void {
    for (const group of groups) {
        group.properties?.forEach(p => {
            if (p.key === key) {
                p.readOnly = true;
            }
        });
        if (group.propertyGroups) {
            setReadOnly(group.propertyGroups, key);
        }
    }
}
