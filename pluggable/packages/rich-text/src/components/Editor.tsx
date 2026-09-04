import { ReactElement, useEffect, useRef, useState } from "react";
import { CKEditorInstance, loadCKEditor } from "../ckeditor4/loadCKEditor";
import { registerMendixLinkPlugin } from "../ckeditor4/mendixLinkPlugin";
import { registerPasteBase64Plugin } from "../ckeditor4/pasteBase64Plugin";
import { buildCustomToolbar, buildToolbarGroups, CustomToolbarItem, ToolbarBooleans } from "../ckeditor4/buildToolbar";

export type EnterMode = "P" | "BR" | "DIV";

export interface EditorProps extends ToolbarBooleans {
    value: string;
    disabled: boolean;
    scriptUrl: string;
    /** rendered above the editor when set */
    label?: string;
    useCustomToolbar: boolean;
    customToolbars: CustomToolbarItem[];
    enterMode: EnterMode;
    shiftEnterMode: EnterMode;
    autoParagraph: boolean;
    enableSpellCheck: boolean;
    bodyCssClass: string;
    width: number;
    height: number;
    maximizeOffset: number;
    showStatusBar: boolean;
    showToolbarCollapsed: boolean;
    enableCodeHighlighting: boolean;
    imagePasteMode: "base64" | "upload";
    /** legacy `useImageStyleProperty` — accepted; image sizing wiring is Phase 4 */
    useImageStyleProperty: boolean;
    countPlugin: boolean;
    countPluginMaxCount: number;
    links: Array<{ name: string }>;
    onChange: (html: string) => void;
    onBlur: (html: string) => void;
    onKey: (html: string) => void;
}

const ENTER_MODE: Record<EnterMode, number> = { P: 1, BR: 2, DIV: 3 };

const LOAD_ERROR_MESSAGE =
    "The rich text editor could not be loaded — the CKEditor script was not found. Copy a `ckeditor/` folder into the " +
    "app's theme/web/ (run `npm run assemble-ckeditor` in the widget repo). You can view and edit the raw HTML below " +
    "in the meantime; formatting returns once the script loads. See the browser console for details.";

/**
 * Manual CKEditor 4 wrapper. The official `ckeditor4-react` package is not used:
 * its current majors are tied to the commercial LTS licence and only declare
 * React ^18. A hand-rolled effect gives full control over the StrictMode
 * double-mount and the `CKEDITOR.instances` cleanup.
 *
 * Config is mapped 1:1 from the legacy Dojo widget's `_createChildNodes`.
 */
export function Editor(props: EditorProps): ReactElement {
    const hostRef = useRef<HTMLDivElement>(null);
    const instanceRef = useRef<CKEditorInstance | null>(null);
    const lastEmitted = useRef(props.value);
    const [loadError, setLoadError] = useState(false);

    const propsRef = useRef(props);
    useEffect(() => {
        propsRef.current = props;
    });

    useEffect(() => {
        let destroyed = false;
        const host = hostRef.current;
        if (!host) {
            return;
        }

        setLoadError(false);
        loadCKEditor(propsRef.current.scriptUrl)
            .then(CKEDITOR => {
                if (destroyed) {
                    return;
                }
                registerMendixLinkPlugin();
                registerPasteBase64Plugin();

                const p = propsRef.current;
                const extraPlugins = ["divarea", "mendixlink", "tableresize", "maximize", "widget"];
                if (p.imagePasteMode === "base64") {
                    extraPlugins.push("pastebase64");
                }
                if (p.enableCodeHighlighting) {
                    extraPlugins.push("codesnippet");
                }
                if (p.countPlugin) {
                    extraPlugins.push("wordcount");
                }

                const removePlugins: string[] = [];
                const config: Record<string, unknown> = {
                    versionCheck: false,
                    // Match the legacy 'full' build — no ACF stripping of stored content.
                    allowedContent: true,
                    extraPlugins: extraPlugins.join(","),
                    enterMode: ENTER_MODE[p.enterMode],
                    shiftEnterMode: ENTER_MODE[p.shiftEnterMode],
                    autoParagraph: p.autoParagraph,
                    disableNativeSpellChecker: !p.enableSpellCheck,
                    maximizeOffset: p.maximizeOffset,
                    toolbarCanCollapse: true,
                    toolbarStartupExpanded: !p.showToolbarCollapsed,
                    autoGrow_onStartup: true,
                    autoGrow_minHeight: 300,
                    bodyClass: p.bodyCssClass || "",
                    oembed_WrapperClass: "embededContent",
                    mendixLink: { links: p.links },
                    readOnly: p.disabled
                };

                if (p.useCustomToolbar) {
                    config.toolbar = buildCustomToolbar(p.customToolbars);
                } else {
                    config.toolbarGroups = buildToolbarGroups(p);
                }

                if (p.width > 0) {
                    config.width = p.width;
                }
                if (p.height > 0) {
                    config.height = p.height;
                }
                if (!p.showStatusBar) {
                    removePlugins.push("elementspath");
                    config.resize_enabled = false;
                }
                if (removePlugins.length) {
                    config.removePlugins = removePlugins.join(",");
                }
                if (p.countPlugin) {
                    config.wordcount = {
                        showParagraphs: false,
                        showWordCount: true,
                        showCharCount: true,
                        countSpacesAsChars: true,
                        countHTML: true,
                        maxWordCount: -1,
                        maxCharCount: p.countPluginMaxCount > 0 ? p.countPluginMaxCount : -1
                    };
                }
                const instance = CKEDITOR.replace(host, config);
                if (!instance) {
                    // eslint-disable-next-line no-console
                    console.error(
                        "CKEditor 4: replace() returned null (element already attached or incompatible browser)"
                    );
                    return;
                }
                instanceRef.current = instance;
                lastEmitted.current = p.value;

                instance.on("instanceReady", () => {
                    if (!destroyed) {
                        instance.setData(propsRef.current.value || "");
                    }
                });

                const emit = (): void => {
                    const html = instance.getData();
                    if (html !== lastEmitted.current) {
                        lastEmitted.current = html;
                        propsRef.current.onChange(html);
                        propsRef.current.onKey(html);
                    }
                };
                instance.on("change", emit);
                instance.on("blur", () => propsRef.current.onBlur(instance.getData()));
            })
            .catch(err => {
                // eslint-disable-next-line no-console
                console.error(err);
                if (!destroyed) {
                    setLoadError(true);
                }
            });

        return () => {
            destroyed = true;
            const instance = instanceRef.current;
            instanceRef.current = null;
            if (instance && window.CKEDITOR?.instances[instance.name]) {
                try {
                    instance.destroy(true);
                } catch {
                    /* ignore double-destroy in StrictMode */
                }
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        props.scriptUrl,
        props.useCustomToolbar,
        props.enterMode,
        props.shiftEnterMode,
        props.enableSpellCheck,
        props.showStatusBar,
        props.showToolbarCollapsed,
        props.enableCodeHighlighting,
        props.countPlugin,
        props.imagePasteMode
    ]);

    // Push external value / read-only changes into a live instance.
    useEffect(() => {
        const instance = instanceRef.current;
        if (instance && instance.status === "ready" && props.value !== instance.getData()) {
            lastEmitted.current = props.value;
            instance.setData(props.value || "");
        }
    }, [props.value]);

    useEffect(() => {
        const instance = instanceRef.current;
        if (instance && instance.status === "ready") {
            instance.setReadOnly(props.disabled);
        }
    }, [props.disabled]);

    return (
        <div className="rt-editor">
            {props.label ? <label className="control-label rt-editor__label">{props.label}</label> : null}
            {loadError ? (
                <div className="rt-editor__fallback">
                    <p className="alert alert-warning rt-editor__error" role="alert">
                        {LOAD_ERROR_MESSAGE}
                    </p>
                    <textarea
                        className="form-control rt-editor__fallback-input"
                        value={props.value}
                        readOnly={props.disabled}
                        rows={8}
                        spellCheck={false}
                        aria-label={props.label || "Rich text (HTML source)"}
                        onChange={e => props.onChange(e.target.value)}
                        onBlur={e => props.onBlur(e.target.value)}
                    />
                </div>
            ) : null}
            <div ref={hostRef} hidden={loadError} />
        </div>
    );
}
