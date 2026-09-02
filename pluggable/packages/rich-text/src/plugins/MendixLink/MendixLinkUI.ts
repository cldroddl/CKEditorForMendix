import { Plugin, addListToDropdown, createDropdown, Collection, ViewModel } from "ckeditor5";
import type { MendixLinkCommand } from "./MendixLinkCommand";

export interface ConfiguredMendixLink {
    name: string;
}

/**
 * Toolbar dropdown "Microflow link". Lists the link names configured on the
 * widget (passed through `editor.config.get('mendixLink.links')`); picking one
 * runs the `mendixLink` command with that function name.
 */
export class MendixLinkUI extends Plugin {
    static get pluginName(): "MendixLinkUI" {
        return "MendixLinkUI";
    }

    init(): void {
        const editor = this.editor;
        const t = editor.t;
        const links = (editor.config.get("mendixLink.links") as ConfiguredMendixLink[] | undefined) ?? [];

        editor.ui.componentFactory.add("mendixLink", locale => {
            const dropdown = createDropdown(locale);
            const command = editor.commands.get("mendixLink") as MendixLinkCommand;

            dropdown.buttonView.set({
                label: t("Microflow link"),
                tooltip: true,
                withText: true
            });
            dropdown.bind("isEnabled").to(command);

            const items = new Collection<{ type: "button"; model: ViewModel }>();
            for (const link of links) {
                items.add({
                    type: "button",
                    model: new ViewModel({
                        label: link.name,
                        withText: true,
                        mendixLinkName: link.name
                    })
                });
            }
            addListToDropdown(dropdown, items);

            if (links.length === 0) {
                dropdown.buttonView.set({
                    tooltip: t("No microflow links configured on this widget")
                });
            }

            dropdown.on("execute", evt => {
                const name = (evt.source as { mendixLinkName?: string }).mendixLinkName;
                if (name) {
                    editor.execute("mendixLink", { functionName: name });
                    editor.editing.view.focus();
                }
            });

            return dropdown;
        });
    }
}
