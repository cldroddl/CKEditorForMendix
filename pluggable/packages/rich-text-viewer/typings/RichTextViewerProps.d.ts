/**
 * This file was generated from RichTextViewer.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { ActionValue, EditableValue } from "mendix";
import { CSSProperties } from "react";

export interface MicroflowLinksType {
    functionNames: string;
    mfName?: ActionValue;
}

export interface MicroflowLinksPreviewType {
    functionNames: string;
    mfName: {} | null;
}

export interface RichTextViewerContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    messageString: EditableValue<string>;
    microflowLinks: MicroflowLinksType[];
    cutOffRules: number;
}

export interface RichTextViewerPreviewProps {
    /**
     * @deprecated Deprecated since version 9.18.0. Please use class property instead.
     */
    className: string;
    class: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    renderMode: "design" | "xray" | "structure";
    translate: (text: string) => string;
    messageString: string;
    microflowLinks: MicroflowLinksPreviewType[];
    cutOffRules: number | null;
}
