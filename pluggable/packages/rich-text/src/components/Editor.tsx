import { ReactElement, useEffect, useRef } from "react";
import { CKEditorInstance, loadCKEditor } from "../ckeditor4/loadCKEditor";
import { registerMendixLinkPlugin } from "../ckeditor4/mendixLinkPlugin";
import { resolveToolbar, ToolbarPreset } from "../ckeditor4/toolbarPresets";

export interface EditorProps {
    value: string;
    disabled: boolean;
    scriptUrl: string;
    preset: ToolbarPreset;
    customToolbar?: string;
    enterMode: "P" | "BR";
    spellChecker: boolean;
    minHeight: number;
    maxHeight: number;
    editorBodyClass?: string;
    maxCount: number;
    links: Array<{ name: string }>;
    onChange: (html: string) => void;
    onBlur: (html: string) => void;
    onKey: (html: string) => void;
}

/**
 * Manual CKEditor 4 wrapper. The official `ckeditor4-react` package is not used:
 * its current majors are tied to the commercial LTS licence and only declare
 * React ^18. A hand-rolled effect gives full control over the StrictMode
 * double-mount and the `CKEDITOR.instances` cleanup, which is the documented
 * pattern for CKEditor 4 in modern React.
 */
export function Editor(props: EditorProps): ReactElement {
    const hostRef = useRef<HTMLDivElement>(null);
    const instanceRef = useRef<CKEditorInstance | null>(null);
    const lastEmitted = useRef(props.value);

    // Keep the latest callbacks/flags without re-creating the editor.
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

        loadCKEditor(propsRef.current.scriptUrl)
            .then(CKEDITOR => {
                if (destroyed) {
                    return;
                }
                registerMendixLinkPlugin();

                const p = propsRef.current;
                const config: Record<string, unknown> = {
                    // 4.22.0 is EOL open source; silence the CDN version-check nag.
                    versionCheck: false,
                    extraPlugins: "mendixlink",
                    removePlugins: "elementspath",
                    resize_enabled: false,
                    toolbar: resolveToolbar(p.preset, p.customToolbar),
                    enterMode: p.enterMode === "BR" ? 2 /* CKEDITOR.ENTER_BR */ : 1 /* CKEDITOR.ENTER_P */,
                    disableNativeSpellChecker: !p.spellChecker,
                    autoGrow_onStartup: true,
                    autoGrow_minHeight: p.minHeight > 0 ? p.minHeight : 200,
                    autoGrow_maxHeight: p.maxHeight > 0 ? p.maxHeight : 0,
                    bodyClass: p.editorBodyClass || "",
                    extraAllowedContent: "a[data-mf,href,title,class];*[data-*]",
                    mendixLink: { links: p.links },
                    readOnly: p.disabled
                };
                if (p.maxHeight > 0) {
                    config.height = p.maxHeight;
                }

                const instance = CKEDITOR.replace(host, config);
                instanceRef.current = instance;
                lastEmitted.current = p.value;

                instance.on("instanceReady", () => {
                    if (!destroyed) {
                        instance.setData(propsRef.current.value || "");
                    }
                });

                const emit = (): void => {
                    const html = instance.getData();
                    propsRef.current.onKey(html);
                    if (html !== lastEmitted.current) {
                        lastEmitted.current = html;
                        propsRef.current.onChange(html);
                    }
                };
                instance.on("change", emit);
                instance.on("key", () => window.setTimeout(emit, 0));
                instance.on("blur", () => propsRef.current.onBlur(instance.getData()));
            })
            .catch(err => {
                // eslint-disable-next-line no-console
                console.error(err);
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
    }, [props.scriptUrl, props.preset, props.customToolbar, props.enterMode, props.spellChecker]);

    // Push external value / read-only changes into a live instance.
    useEffect(() => {
        const instance = instanceRef.current;
        if (instance && instance.status === "ready") {
            if (props.value !== instance.getData()) {
                lastEmitted.current = props.value;
                instance.setData(props.value || "");
            }
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
            <div ref={hostRef} />
            {props.maxCount > 0 && <div className="rt-count" />}
        </div>
    );
}
