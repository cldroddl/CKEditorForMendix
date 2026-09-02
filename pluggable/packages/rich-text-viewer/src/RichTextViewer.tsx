import { ReactElement, useMemo } from "react";
import { ValueStatus } from "mendix";
import { MicroflowLinkBinding, RichTextView, migrateStoredValue } from "@ckeditorformendix/shared";
import { RichTextViewerContainerProps } from "../typings/RichTextViewerProps";

import "./ui/RichTextViewer.css";

export function RichTextViewer(props: RichTextViewerContainerProps): ReactElement | null {
    const { content, microflowLinks, maxLines, highlightCode, class: className } = props;

    const html = useMemo(() => migrateStoredValue(content.value ?? ""), [content.value]);

    const links = useMemo<MicroflowLinkBinding[]>(
        () =>
            microflowLinks.map(item => ({
                name: item.linkName,
                execute: item.linkAction?.canExecute ? () => item.linkAction?.execute() : undefined
            })),
        [microflowLinks]
    );

    if (content.status !== ValueStatus.Available) {
        return null;
    }

    return (
        <RichTextView
            className={className}
            html={html}
            links={links}
            maxLines={maxLines}
            highlightCode={highlightCode}
        />
    );
}
