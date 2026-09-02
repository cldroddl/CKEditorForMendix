/**
 * This file was generated from RichText.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { ActionValue, EditableValue } from "mendix";

export type PresetEnum = "basic" | "standard" | "full" | "custom";

export type EnterModeEnum = "P" | "BR";

export interface MicroflowLinksType {
    linkName: string;
    linkAction?: ActionValue;
}

export interface MicroflowLinksPreviewType {
    linkName: string;
    linkAction: {} | null;
}

export interface RichTextContainerProps {
    name: string;
    tabIndex?: number;
    id: string;
    content: EditableValue<string>;
    onChange?: ActionValue;
    onKeyPress?: ActionValue;
    preset: PresetEnum;
    customToolbar: string;
    enterMode: EnterModeEnum;
    spellChecker: boolean;
    editorBodyClass: string;
    minHeight: number;
    maxHeight: number;
    editorScriptUrl: string;
    microflowLinks: MicroflowLinksType[];
}

export interface RichTextPreviewProps {
    readOnly: boolean;
    renderMode: "design" | "xray" | "structure";
    translate: (text: string) => string;
    content: string;
    onChange: {} | null;
    onKeyPress: {} | null;
    preset: PresetEnum;
    customToolbar: string;
    enterMode: EnterModeEnum;
    spellChecker: boolean;
    editorBodyClass: string;
    minHeight: number | null;
    maxHeight: number | null;
    editorScriptUrl: string;
    microflowLinks: MicroflowLinksPreviewType[];
}
