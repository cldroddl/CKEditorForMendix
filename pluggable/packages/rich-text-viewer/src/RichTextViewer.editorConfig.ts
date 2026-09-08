import { MICROFLOW_LINKS_ENABLED } from "@ckeditorformendix/shared";
import { RichTextViewerPreviewProps } from "../typings/RichTextViewerProps";

type Properties = PropertyGroup[];

interface PropertyGroup {
    caption: string;
    propertyGroups?: PropertyGroup[];
    properties?: Property[];
}

interface Property {
    key: string;
    caption: string;
}

interface Problem {
    property?: string;
    severity?: "error" | "warning" | "deprecation";
    message: string;
}

export function getProperties(_values: RichTextViewerPreviewProps, defaultProperties: Properties): Properties {
    if (!MICROFLOW_LINKS_ENABLED) {
        for (const group of defaultProperties) {
            if (group.properties) {
                group.properties = group.properties.filter(p => p.key !== "microflowLinks");
            }
        }
        const idx = defaultProperties.findIndex(g => g.caption === "Microflow links" && !g.properties?.length);
        if (idx !== -1) {
            defaultProperties.splice(idx, 1);
        }
    }
    return defaultProperties;
}

export function check(values: RichTextViewerPreviewProps): Problem[] {
    const problems: Problem[] = [];
    if (!MICROFLOW_LINKS_ENABLED) {
        return problems;
    }
    values.microflowLinks.forEach((link, i) => {
        if (!link.functionNames?.trim()) {
            problems.push({
                property: `microflowLinks/${i + 1}/functionNames`,
                message: "Link Name is required."
            });
        }
        if (!link.mfName) {
            problems.push({
                property: `microflowLinks/${i + 1}/mfName`,
                message: `No microflow set for link "${link.functionNames}"; clicks will do nothing.`,
                severity: "warning"
            });
        }
    });
    return problems;
}
