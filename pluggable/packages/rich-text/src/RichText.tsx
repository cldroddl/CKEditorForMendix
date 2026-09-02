import { ReactElement, useCallback, useRef } from "react";
import { ValueStatus } from "mendix";
import { RichTextContainerProps } from "../typings/RichTextProps";
import { Editor } from "./components/Editor";
import { DEFAULT_CKEDITOR_URL } from "./ckeditor4/loadCKEditor";

import "./ui/RichText.css";

export function RichText(props: RichTextContainerProps): ReactElement | null {
    const { content, onChange, onKeyPress, microflowLinks } = props;
    const keyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const commit = useCallback(
        (html: string) => {
            if (content.status === ValueStatus.Available && !content.readOnly && html !== content.value) {
                content.setValue(html);
            }
        },
        [content]
    );

    const fireChange = useCallback(() => {
        if (onChange?.canExecute) {
            onChange.execute();
        }
    }, [onChange]);

    const fireKey = useCallback(() => {
        if (!onKeyPress?.canExecute) {
            return;
        }
        clearTimeout(keyTimer.current);
        keyTimer.current = setTimeout(() => onKeyPress.execute(), 250);
    }, [onKeyPress]);

    if (content.status === ValueStatus.Loading) {
        return null;
    }

    return (
        <Editor
            value={content.value ?? ""}
            disabled={content.readOnly}
            scriptUrl={props.editorScriptUrl?.trim() || DEFAULT_CKEDITOR_URL}
            preset={props.preset}
            customToolbar={props.customToolbar}
            enterMode={props.enterMode}
            spellChecker={props.spellChecker}
            minHeight={props.minHeight}
            maxHeight={props.maxHeight}
            editorBodyClass={props.editorBodyClass}
            maxCount={0}
            links={microflowLinks.map(l => ({ name: l.linkName }))}
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
