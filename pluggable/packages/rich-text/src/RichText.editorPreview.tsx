import { ReactElement } from "react";
import { RichTextPreviewProps } from "../typings/RichTextProps";

/**
 * Design-mode preview. CKEditor is NOT loaded here (it touches window/document at
 * import time and is heavy); a lightweight stand-in is rendered instead.
 */
export function preview(props: RichTextPreviewProps): ReactElement {
    return (
        <div
            style={{
                border: "1px solid var(--color-border, #ced0d3)",
                borderRadius: 4,
                minHeight: props.minHeight ?? 200,
                padding: 8,
                background: "#fff",
                color: "#6c7180",
                font: "14px/1.4 sans-serif"
            }}
        >
            <div
                style={{
                    borderBottom: "1px solid #eee",
                    paddingBottom: 6,
                    marginBottom: 6
                }}
            >
                Rich Text — {props.preset} toolbar
                {props.microflowLinks.length ? ` · ${props.microflowLinks.length} microflow link(s)` : ""}
            </div>
            <div
                dangerouslySetInnerHTML={{
                    __html: props.content || "<em>Bound content renders here at runtime.</em>"
                }}
            />
        </div>
    );
}

export function getPreviewCss(): string {
    return require("./ui/RichText.css");
}
