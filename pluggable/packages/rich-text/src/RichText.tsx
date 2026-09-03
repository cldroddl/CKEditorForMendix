import { ReactElement, useCallback, useRef } from "react";
import { ValueStatus } from "mendix";
import { RichTextContainerProps } from "../typings/RichTextProps";
import { Editor } from "./components/Editor";
import { DEFAULT_CKEDITOR_URL } from "./ckeditor4/loadCKEditor";

import "./ui/RichText.css";

export function RichText(props: RichTextContainerProps): ReactElement | null {
    const { messageString, onChangeMicroflow, onKeyPressMicroflow, microflowLinks } = props;
    const keyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const commit = useCallback(
        (html: string) => {
            if (
                messageString.status === ValueStatus.Available &&
                !messageString.readOnly &&
                html !== messageString.value
            ) {
                messageString.setValue(html);
            }
        },
        [messageString]
    );

    const fireChange = useCallback(() => {
        if (onChangeMicroflow?.canExecute) {
            onChangeMicroflow.execute();
        }
    }, [onChangeMicroflow]);

    const fireKey = useCallback(() => {
        if (!onKeyPressMicroflow?.canExecute) {
            return;
        }
        clearTimeout(keyTimer.current);
        keyTimer.current = setTimeout(() => onKeyPressMicroflow.execute(), 250);
    }, [onKeyPressMicroflow]);

    if (messageString.status === ValueStatus.Loading) {
        return null;
    }

    const label = props.showLabel ? props.fieldCaption?.value : undefined;

    return (
        <Editor
            value={messageString.value ?? ""}
            disabled={messageString.readOnly}
            scriptUrl={props.editorScriptUrl?.trim() || DEFAULT_CKEDITOR_URL}
            label={label || undefined}
            toolbarDocument={props.toolbarDocument}
            toolbarClipboard={props.toolbarClipboard}
            toolbarEditing={props.toolbarEditing}
            toolbarForms={props.toolbarForms}
            toolbarSeperator1={props.toolbarSeperator1}
            toolbarBasicstyles={props.toolbarBasicstyles}
            toolbarParagraph={props.toolbarParagraph}
            toolbarLinks={props.toolbarLinks}
            toolbarInsert={props.toolbarInsert}
            toolbarSeperator2={props.toolbarSeperator2}
            toolbarStyles={props.toolbarStyles}
            toolbarColors={props.toolbarColors}
            toolbarTools={props.toolbarTools}
            toolbarOthers={props.toolbarOthers}
            useCustomToolbar={props.useCustomToolbar}
            customToolbars={props.customToolbars}
            enterMode={props.enterMode}
            shiftEnterMode={props.shiftEnterMode}
            autoParagraph={props.autoParagraph}
            enableSpellCheck={props.enableSpellCheck}
            bodyCssClass={props.bodyCssClass}
            width={props.width}
            height={props.height}
            maximizeOffset={props.maximizeOffset}
            showStatusBar={props.showStatusBar}
            showToolbarCollapsed={props.showToolbarCollapsed}
            enableCodeHighlighting={props.enableCodeHighlighting}
            imagePasteMode={props.imagePasteMode}
            useImageStyleProperty={props.useImageStyleProperty}
            countPlugin={props.countPlugin}
            countPluginMaxCount={props.countPluginMaxCount}
            links={microflowLinks.map(l => ({ name: l.functionNames }))}
            onChange={commit}
            onBlur={html => {
                commit(html);
                fireChange();
            }}
            onKey={html => {
                commit(html);
                fireKey();
            }}
        />
    );
}
