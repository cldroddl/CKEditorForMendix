import { ReactElement, useMemo, useRef } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
    Alignment,
    AutoLink,
    Autoformat,
    BlockQuote,
    Bold,
    ClassicEditor,
    Code,
    CodeBlock,
    type EditorConfig,
    Essentials,
    FontBackgroundColor,
    FontColor,
    FontFamily,
    FontSize,
    GeneralHtmlSupport,
    Heading,
    HorizontalLine,
    Indent,
    Italic,
    Link,
    List,
    MediaEmbed,
    Paragraph,
    PasteFromOffice,
    RemoveFormat,
    ShiftEnter,
    SourceEditing,
    SpecialCharacters,
    Strikethrough,
    Subscript,
    Superscript,
    Table,
    TableToolbar,
    TodoList,
    Underline,
    WordCount
} from "ckeditor5";
import { resolveToolbar, type ToolbarPreset } from "@ckeditorformendix/shared";
import { MendixLink, type ConfiguredMendixLink } from "../plugins/MendixLink";

import "ckeditor5/ckeditor5.css";

export interface EditorProps {
    value: string;
    disabled: boolean;
    preset: ToolbarPreset;
    customToolbar?: string;
    enterMode: "P" | "BR";
    spellChecker: boolean;
    codeBlock: boolean;
    minHeight: number;
    maxHeight: number;
    editorBodyClass?: string;
    showCount: boolean;
    maxCount: number;
    links: ConfiguredMendixLink[];
    onChange: (html: string) => void;
    onBlur: (html: string) => void;
    onKey: (html: string) => void;
}

export function Editor(props: EditorProps): ReactElement {
    const lastEmitted = useRef(props.value);
    const wordCountWrapRef = useRef<HTMLDivElement>(null);

    const config = useMemo<EditorConfig>(() => {
        const plugins: NonNullable<EditorConfig["plugins"]> = [
            Essentials,
            Paragraph,
            Heading,
            Bold,
            Italic,
            Underline,
            Strikethrough,
            Subscript,
            Superscript,
            Code,
            RemoveFormat,
            FontFamily,
            FontSize,
            FontColor,
            FontBackgroundColor,
            Link,
            AutoLink,
            List,
            TodoList,
            Indent,
            Alignment,
            BlockQuote,
            Table,
            TableToolbar,
            MediaEmbed,
            HorizontalLine,
            SpecialCharacters,
            Autoformat,
            PasteFromOffice,
            GeneralHtmlSupport,
            SourceEditing,
            WordCount,
            MendixLink
        ];
        if (props.enterMode === "BR") {
            plugins.push(ShiftEnter);
        }
        if (props.codeBlock) {
            plugins.push(CodeBlock);
        }

        return {
            // CKEditor 5 >= v44 requires an explicit license key. This widget ships GPL.
            licenseKey: "GPL",
            plugins,
            toolbar: {
                items: resolveToolbar(props.preset, props.customToolbar),
                shouldNotGroupWhenFull: false
            },
            table: { contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"] },
            htmlSupport: {
                // Preserve attributes the viewer relies on (data-*, style on img, etc.)
                allow: [{ name: /.*/, attributes: true, classes: true, styles: true }]
            },
            mendixLink: { links: props.links },
            wordCount: {
                onUpdate: (stats: { characters: number }) => {
                    const el = wordCountWrapRef.current;
                    if (el && props.maxCount > 0) {
                        el.classList.toggle("rt-count--over", stats.characters > props.maxCount);
                    }
                }
            }
        } as EditorConfig;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.preset, props.customToolbar, props.enterMode, props.codeBlock, props.links, props.maxCount]);

    const editorStyle = {
        "--ck-min-height": props.minHeight > 0 ? `${props.minHeight}px` : undefined,
        "--ck-max-height": props.maxHeight > 0 ? `${props.maxHeight}px` : undefined
    } as Record<string, string | undefined>;

    return (
        <div className="rt-editor" style={editorStyle}>
            <CKEditor
                editor={ClassicEditor}
                config={config}
                data={props.value}
                disabled={props.disabled}
                onReady={editor => {
                    if (props.editorBodyClass) {
                        editor.editing.view.change(writer => {
                            writer.addClass(
                                props.editorBodyClass!.split(/\s+/).filter(Boolean),
                                editor.editing.view.document.getRoot()!
                            );
                        });
                    }
                }}
                onChange={(_evt, editor) => {
                    const html = editor.getData();
                    props.onKey(html);
                    if (html !== lastEmitted.current) {
                        lastEmitted.current = html;
                        props.onChange(html);
                    }
                }}
                onBlur={(_evt, editor) => props.onBlur(editor.getData())}
            />
            {props.showCount && <div ref={wordCountWrapRef} className="rt-count" />}
        </div>
    );
}
