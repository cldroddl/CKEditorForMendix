import { RichTextViewerPreviewProps } from "../typings/RichTextViewerProps";

interface Problem {
    property?: string;
    severity?: "error" | "warning" | "deprecation";
    message: string;
}

export function check(values: RichTextViewerPreviewProps): Problem[] {
    const problems: Problem[] = [];
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
