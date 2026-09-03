import { ReactElement, useMemo } from "react";
import { ValueStatus } from "mendix";
import { MicroflowLinkBinding, RichTextView, migrateStoredValue } from "@ckeditorformendix/shared";
import { RichTextViewerContainerProps } from "../typings/RichTextViewerProps";

import "./ui/RichTextViewer.css";

export function RichTextViewer(props: RichTextViewerContainerProps): ReactElement | null {
    const { messageString, microflowLinks, cutOffRules, class: className } = props;

    const html = useMemo(() => migrateStoredValue(messageString.value ?? ""), [messageString.value]);

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
