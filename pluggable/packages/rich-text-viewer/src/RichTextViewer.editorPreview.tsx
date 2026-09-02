import { ReactElement } from "react";
import { RichTextViewerPreviewProps } from "../typings/RichTextViewerProps";

export function preview(props: RichTextViewerPreviewProps): ReactElement {
    return (
        <div
            style={{ font: "14px/1.4 sans-serif", color: "#3b4251" }}
            dangerouslySetInnerHTML={{
                __html: props.content || "<em>Bound content renders here at runtime.</em>"
            }}
        />
    );
}
