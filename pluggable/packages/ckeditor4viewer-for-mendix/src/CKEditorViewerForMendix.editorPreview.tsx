import { ReactElement } from "react";
import { CKEditorViewerForMendixPreviewProps } from "../typings/CKEditorViewerForMendixProps";

export function preview(props: CKEditorViewerForMendixPreviewProps): ReactElement {
    return (
        <div
            style={{ font: "14px/1.4 sans-serif", color: "#3b4251" }}
            dangerouslySetInnerHTML={{
                __html: props.messageString || "<em>Bound content renders here at runtime.</em>"
            }}
        />
    );
}
