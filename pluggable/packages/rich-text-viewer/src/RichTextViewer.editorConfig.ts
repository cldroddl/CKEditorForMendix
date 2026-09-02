import { RichTextViewerPreviewProps } from "../typings/RichTextViewerProps";

interface Problem {
    property?: string;
    severity?: "error" | "warning" | "deprecation";
    message: string;
}

export function check(values: RichTextViewerPreviewProps): Problem[] {
    const problems: Problem[] = [];
    values.microflowLinks.forEach((link, i) => {
        if (!link.linkName?.trim()) {
            problems.push({
                property: `microflowLinks/${i + 1}/linkName`,
                message: "Link name is required."
            });
        }
        if (!link.linkAction) {
            problems.push({
                property: `microflowLinks/${i + 1}/linkAction`,
                message: `No action set for link "${link.linkName}"; clicks will do nothing.`,
                severity: "warning"
            });
        }
    });
    return problems;
}
