import { Command } from "ckeditor5";

export interface MendixLinkCommandOptions {
    functionName: string;
    /** Optional label to insert when the selection is collapsed. */
    label?: string;
}

/**
 * Applies (or updates) the `mendixLinkFn` attribute on the current selection.
 * When the selection is collapsed, inserts the label text and links it.
 */
export class MendixLinkCommand extends Command {
    override refresh(): void {
        const model = this.editor.model;
        const selection = model.document.selection;
        this.value = selection.getAttribute("mendixLinkFn") ?? false;
        this.isEnabled = model.schema.checkAttributeInSelection(selection, "mendixLinkFn");
    }

    override execute(options: MendixLinkCommandOptions): void {
        const model = this.editor.model;
        const selection = model.document.selection;
        const { functionName, label } = options;

        model.change(writer => {
            if (selection.isCollapsed) {
                const text = label?.trim() || functionName;
                const position = selection.getFirstPosition()!;
                const node = writer.createText(text, { mendixLinkFn: functionName });
                model.insertContent(node, position);
                writer.setSelection(node, "on");
                return;
            }

            for (const range of model.schema.getValidRanges(selection.getRanges(), "mendixLinkFn")) {
                writer.setAttribute("mendixLinkFn", functionName, range);
            }
        });
    }
}
