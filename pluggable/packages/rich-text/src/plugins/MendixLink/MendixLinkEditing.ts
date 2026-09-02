import { Plugin } from "ckeditor5";
import { MICROFLOW_LINK_CLASS } from "@ckeditorformendix/shared";
import { MendixLinkCommand } from "./MendixLinkCommand";

/**
 * Model/view layer for microflow links.
 *
 * The function name is stored as a text attribute `mendixLinkFn`. It downcasts to
 * `<a class="mx-microflow-link" data-mf="<fn>" href="#">` and upcasts back from
 * any anchor carrying `data-mf` OR the legacy `mx-microflow-link` + inline
 * `onclick="CKEditorViewer.mf.exec('fn', ...)"`.
 */
export class MendixLinkEditing extends Plugin {
    static get pluginName(): "MendixLinkEditing" {
        return "MendixLinkEditing";
    }

    init(): void {
        const editor = this.editor;

        editor.model.schema.extend("$text", { allowAttributes: "mendixLinkFn" });

        editor.conversion.for("downcast").attributeToElement({
            model: "mendixLinkFn",
            view: (functionName, { writer }) => {
                if (!functionName) {
                    return;
                }
                return writer.createAttributeElement(
                    "a",
                    { class: MICROFLOW_LINK_CLASS, "data-mf": functionName, href: "#" },
                    { priority: 5 }
                );
            }
        });

        editor.conversion.for("upcast").elementToAttribute({
            view: {
                name: "a",
                attributes: { "data-mf": true }
            },
            model: {
                key: "mendixLinkFn",
                value: (viewElement: { getAttribute(name: string): string | undefined }) =>
                    viewElement.getAttribute("data-mf")
            }
        });

        editor.conversion.for("upcast").elementToAttribute({
            view: {
                name: "a",
                classes: MICROFLOW_LINK_CLASS,
                attributes: { onclick: /CKEditorViewer\.mf\.exec/ }
            },
            model: {
                key: "mendixLinkFn",
                value: (viewElement: { getAttribute(name: string): string | undefined }) => {
                    const onclick = viewElement.getAttribute("onclick") ?? "";
                    const match = /CKEditorViewer\.mf\.exec\(\s*['"]([^'"]+)['"]/.exec(onclick);
                    return match ? match[1] : null;
                }
            },
            converterPriority: "high"
        });

        editor.commands.add("mendixLink", new MendixLinkCommand(editor));
    }
}
