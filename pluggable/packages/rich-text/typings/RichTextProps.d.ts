/**
 * This file was generated from RichText.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { ActionValue, DynamicValue, EditableValue } from "mendix";
import { CSSProperties } from "react";

export type EnterModeEnum = "P" | "BR" | "DIV";

export type ShiftEnterModeEnum = "P" | "BR" | "DIV";

export type CtItemTypeEnum =
    | "seperator"
    | "About"
    | "Anchor"
    | "BGColor"
    | "Blockquote"
    | "Bold"
    | "BulletedList"
    | "Button"
    | "Checkbox"
    | "CodeSnippet"
    | "Copy"
    | "CreateDiv"
    | "Cut"
    | "Find"
    | "Font"
    | "FontSize"
    | "Form"
    | "Format"
    | "HiddenField"
    | "HorizontalRule"
    | "Iframe"
    | "Image"
    | "ImageButton"
    | "Indent"
    | "Italic"
    | "JustifyBlock"
    | "JustifyCenter"
    | "JustifyLeft"
    | "JustifyRight"
    | "Language"
    | "Link"
    | "Maximize"
    | "mendixlink"
    | "NewPage"
    | "NumberedList"
    | "Outdent"
    | "PageBreak"
    | "Paste"
    | "PasteFromWord"
    | "PasteText"
    | "Preview"
    | "Print"
    | "Radio"
    | "Redo"
    | "RemoveFormat"
    | "Replace"
    | "Scayt"
    | "Select"
    | "SelectAll"
    | "ShowBlocks"
    | "Smiley"
    | "Source"
    | "SpecialChar"
    | "Strike"
    | "Styles"
    | "Subscript"
    | "Superscript"
    | "Table"
    | "Templates"
    | "BidiLtr"
    | "BidiRtl"
    | "TextColor"
    | "TextField"
    | "Textarea"
    | "Underline"
    | "Undo"
    | "Unlink";

export interface CustomToolbarsType {
    ctItemType: CtItemTypeEnum;
    ctItemToolbar: string;
}

export interface MicroflowLinksType {
    functionNames: string;
}

export type ImagePasteModeEnum = "base64" | "upload";

export interface CustomToolbarsPreviewType {
    ctItemType: CtItemTypeEnum;
    ctItemToolbar: string;
}

export interface MicroflowLinksPreviewType {
    functionNames: string;
}

export interface RichTextContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    messageString: EditableValue<string>;
    onKeyPressMicroflow?: ActionValue;
    onChangeMicroflow?: ActionValue;
    enterMode: EnterModeEnum;
    shiftEnterMode: ShiftEnterModeEnum;
    autoParagraph: boolean;
    enableSpellCheck: boolean;
    toolbarDocument: boolean;
    toolbarClipboard: boolean;
    toolbarEditing: boolean;
    toolbarForms: boolean;
    toolbarSeperator1: boolean;
    toolbarBasicstyles: boolean;
    toolbarParagraph: boolean;
    toolbarLinks: boolean;
    toolbarInsert: boolean;
    toolbarSeperator2: boolean;
    toolbarStyles: boolean;
    toolbarColors: boolean;
    toolbarTools: boolean;
    toolbarOthers: boolean;
    useCustomToolbar: boolean;
    customToolbars: CustomToolbarsType[];
    bodyCssClass: string;
    width: number;
    height: number;
    showLabel: boolean;
    fieldCaption?: DynamicValue<string>;
    maximizeOffset: number;
    showStatusBar: boolean;
    showToolbarCollapsed: boolean;
    enableCodeHighlighting: boolean;
    microflowLinks: MicroflowLinksType[];
    imagePasteMode: ImagePasteModeEnum;
    imageUploadMicroflow?: ActionValue;
    useImageStyleProperty: boolean;
    countPlugin: boolean;
    countPluginMaxCount: number;
    editorScriptUrl: string;
}

export interface RichTextPreviewProps {
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
    onKeyPressMicroflow: {} | null;
    onChangeMicroflow: {} | null;
    enterMode: EnterModeEnum;
    shiftEnterMode: ShiftEnterModeEnum;
    autoParagraph: boolean;
    enableSpellCheck: boolean;
    toolbarDocument: boolean;
    toolbarClipboard: boolean;
    toolbarEditing: boolean;
    toolbarForms: boolean;
    toolbarSeperator1: boolean;
    toolbarBasicstyles: boolean;
    toolbarParagraph: boolean;
    toolbarLinks: boolean;
    toolbarInsert: boolean;
    toolbarSeperator2: boolean;
    toolbarStyles: boolean;
    toolbarColors: boolean;
    toolbarTools: boolean;
    toolbarOthers: boolean;
    useCustomToolbar: boolean;
    customToolbars: CustomToolbarsPreviewType[];
    bodyCssClass: string;
    width: number | null;
    height: number | null;
    showLabel: boolean;
    fieldCaption: string;
    maximizeOffset: number | null;
    showStatusBar: boolean;
    showToolbarCollapsed: boolean;
    enableCodeHighlighting: boolean;
    microflowLinks: MicroflowLinksPreviewType[];
    imagePasteMode: ImagePasteModeEnum;
    imageUploadMicroflow: {} | null;
    useImageStyleProperty: boolean;
    countPlugin: boolean;
    countPluginMaxCount: number | null;
    editorScriptUrl: string;
}
