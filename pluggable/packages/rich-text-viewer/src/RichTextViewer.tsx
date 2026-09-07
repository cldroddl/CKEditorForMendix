import { ReactElement, useMemo } from "react";
import { ValueStatus } from "mendix";
import { MicroflowLinkBinding, RichTextView, migrateStoredValue, sanitizeRichText } from "@ckeditorformendix/shared";
import { RichTextViewerContainerProps } from "../typings/RichTextViewerProps";

import "./ui/RichTextViewer.css";

export function RichTextViewer(props: RichTextViewerContainerProps): ReactElement | null {
    const { messageString, microflowLinks, cutOffRules, sanitizeContent, class: className } = props;

    // Migrate legacy microflow-link anchors first (needs the inline onclick that
    // DOMPurify would strip), THEN sanitize. `sanitizeContent` defaults to true;
    // turning it off exposes stored <script>/handlers/javascript: URLs — only for
    // content the app fully trusts (see the widget XML and MIGRATION.md).
    const html = useMemo(() => {
        const migrated = migrateStoredValue(messageString.value ?? "");
        return sanitizeContent ? sanitizeRichText(migrated) : migrated;
    }, [messageString.value, sanitizeContent]);

    const links = useMemo<MicroflowLinkBinding[]>(
        () =>
            microflowLinks.map(item => ({
                name: item.functionNames,
                execute: item.mfName?.canExecute ? () => item.mfName?.execute() : undefined
            })),
        [microflowLinks]
    );

    if (messageString.status !== ValueStatus.Available) {
        return null;
    }

    // Legacy "Cut of rules" = clip the rendered content to this pixel height.
    const clipStyle = cutOffRules > 0 ? { maxHeight: cutOffRules, overflow: "hidden" as const } : undefined;

    return (
        <div className={className} style={clipStyle}>
            <RichTextView html={html} links={links} highlightCode />
        </div>
    );
}
