/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * CKEditor 4 "pastebase64" plugin — pastes clipboard images as inline base64
 * `<img>` data URIs. Ported verbatim from the legacy Dojo widget's
 * `src/CKEditorForMendix/widget/lib/plugins/pastebase64/plugin.js` (MIT, from the
 * CKEditor SDK examples), inlined so no asset copying is needed.
 *
 * Used when the widget's "Image Mode" is "Base64" — the same condition the legacy
 * widget used (`plugins.push("pastebase64")` when not in upload mode).
 */

export const PASTE_BASE64_PLUGIN = "pastebase64";

export function registerPasteBase64Plugin(): void {
    const CKEDITOR = window.CKEDITOR as any;
    if (!CKEDITOR || CKEDITOR.plugins.registered[PASTE_BASE64_PLUGIN]) {
        return;
    }

    CKEDITOR.plugins.add(PASTE_BASE64_PLUGIN, {
        init(editor: any) {
            if (editor.addFeature) {
                editor.addFeature({ allowedContent: "img[alt,id,!src]{width,height}" });
            }
            editor.on("contentDom", () => {
                const editable = editor.editable ? editor.editable() : editor.document;
                editable.on("paste", onPaste, null, { editor });
            });
        }
    });

    function onPaste(event: any): void {
        const editor = event.listenerData && event.listenerData.editor;
        const clipboardData = event.data.$.clipboardData;
        let found = false;
        const imageType = /^image/;

        if (
            !clipboardData ||
            clipboardData.mozItemCount ||
            ((Array.isArray(clipboardData.types) || clipboardData.types instanceof Array) &&
                clipboardData.types.indexOf("text/html") > -1) ||
            ((clipboardData.types instanceof DOMStringList ||
                Object.prototype.toString.call(clipboardData.types) === "[object DOMStringList]") &&
                clipboardData.types.contains("text/html"))
        ) {
            return;
        }

        Array.prototype.forEach.call(clipboardData.types, (type: string, i: number) => {
            if (found) {
                return;
            }
            if (type.match(imageType) || clipboardData.items[i].type.match(imageType)) {
                readImageAsBase64(clipboardData.items[i], editor);
                found = true;
            }
        });
    }

    function readImageAsBase64(item: any, editor: any): void {
        if (!item || typeof item.getAsFile !== "function") {
            return;
        }
        const file = item.getAsFile();
        const reader = new FileReader();
        reader.onload = evt => {
            const element = editor.document.createElement("img", {
                attributes: { src: (evt.target as FileReader).result }
            });
            setTimeout(() => editor.insertElement(element), 10);
        };
        reader.readAsDataURL(file);
    }
}
