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
}

interface Problem {
    property?: string;
    severity?: "error" | "warning" | "deprecation";
    message: string;
}

export function getProperties(values: RichTextPreviewProps, defaultProperties: Properties): Properties {
    if (values.preset !== "custom") {
        hideProperty(defaultProperties, "customToolbar");
    }
    return defaultProperties;
}

export function check(values: RichTextPreviewProps): Problem[] {
    const problems: Problem[] = [];
    if (values.preset === "custom" && !values.customToolbar.trim()) {
        problems.push({
            property: "customToolbar",
            message: "Custom toolbar is selected but no items are listed."
        });
    }
    values.microflowLinks.forEach((link, i) => {
        if (!link.linkName?.trim()) {
            problems.push({
                property: `microflowLinks/${i + 1}/linkName`,
                message: "Link name is required."
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
