/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * CKEditor 4 "mendixlink" plugin — inserts / edits an anchor that the Rich Text
 * Viewer turns into a microflow trigger.
 *
 * Ported from the legacy Dojo widget's
 * `src/CKEditorForMendix/widget/lib/plugins/mendixlink/{plugin,dialogs/mendixlink}.js`,
 * but it writes the NEW wire format used by @ckeditorformendix/shared:
 *
 *     <a href="#" class="<css> mx-microflow-link" data-mf="<linkName>" title="<title>">Label</a>
 *
 * (no inline `onclick` — that won't run under the React viewer and is CSP-hostile).
 *
 * Register once, after the CKEditor 4 script has loaded, before creating an editor.
 * Configured link names are passed via `config.mendixLink = { links: [{ name }] }`.
 */

import { MICROFLOW_LINK_CLASS } from "@ckeditorformendix/shared";

export const MENDIX_LINK_PLUGIN = "mendixlink";

export function registerMendixLinkPlugin(): void {
    const CKEDITOR = window.CKEDITOR as any;
    if (!CKEDITOR || CKEDITOR.plugins.registered[MENDIX_LINK_PLUGIN]) {
        return;
    }

    CKEDITOR.plugins.add(MENDIX_LINK_PLUGIN, {
        init(editor: any) {
            editor.addCommand("insertMendixLink", new CKEDITOR.dialogCommand("mendixLinkDialog"));

            editor.ui.addButton("mendixlink", {
                label: "Insert a Mendix microflow link",
                command: "insertMendixLink",
                toolbar: "links"
            });

            if (editor.contextMenu) {
                editor.addMenuGroup("mendixlinkGroup");
                editor.addMenuItem("mendixlinkItem", {
                    label: "Edit Mendix link",
                    command: "insertMendixLink",
                    group: "mendixlinkGroup"
                });
                editor.contextMenu.addListener((element: any) => {
                    const anchor = element && element.getAscendant("a", true);
                    if (anchor && String(anchor.getAttribute("class") || "").indexOf(MICROFLOW_LINK_CLASS) !== -1) {
                        return { mendixlinkItem: CKEDITOR.TRISTATE_OFF };
                    }
                    return null;
                });
            }

            CKEDITOR.dialog.add("mendixLinkDialog", () => buildDialog(editor));
        }
    });
}

function buildDialog(editor: any): Record<string, unknown> {
    const configured: Array<{ name: string }> = (editor.config.mendixLink && editor.config.mendixLink.links) || [];
    const linkItems: Array<[string, string]> = configured.map(l => [l.name, l.name]);

    return {
        title: "Mendix Link Properties",
        minWidth: 420,
        minHeight: 180,
        contents: [
            {
                id: "tab-basic",
                label: "Settings",
                elements: [
                    {
                        type: "text",
                        id: "mxlinklabel",
                        label: "Link text",
                        setup(this: any, element: any) {
                            this.setValue(element.getText());
                        },
                        commit(this: any, element: any) {
                            element.setText(this.getValue());
                        }
                    },
                    {
                        type: "select",
                        id: "mxlink",
                        label: "Microflow link name",
                        items: linkItems.length ? linkItems : [["(no links configured on the widget)", ""]],
                        default: (linkItems[0] && linkItems[0][1]) || "",
                        setup(this: any, element: any) {
                            this.setValue(element.getAttribute("data-mf") || "");
                        },
                        commit(this: any, element: any) {
                            element.setAttribute("href", "#");
                            element.setAttribute("data-mf", this.getValue());
                        }
                    },
                    {
                        type: "text",
                        id: "mxclass",
                        label: "CSS classes",
                        default: "btn btn-default mx-button",
                        setup(this: any, element: any) {
                            const cls = String(element.getAttribute("class") || "")
                                .split(/\s+/)
                                .filter((c: string) => c && c !== MICROFLOW_LINK_CLASS)
                                .join(" ");
                            this.setValue(cls);
                        },
                        commit(this: any, element: any) {
                            const value = String(this.getValue() || "").trim();
                            element.setAttribute("class", `${value} ${MICROFLOW_LINK_CLASS}`.trim());
                        }
                    },
                    {
                        type: "text",
                        id: "mxtitle",
                        label: "Title (tooltip)",
                        setup(this: any, element: any) {
                            this.setValue(element.getAttribute("title") || "");
                        },
                        commit(this: any, element: any) {
                            const value = String(this.getValue() || "").trim();
                            if (value) {
                                element.setAttribute("title", value);
                            } else {
                                element.removeAttribute("title");
                            }
                        }
                    }
                ]
            }
        ],
        onShow(this: any) {
            const selection = editor.getSelection();
            let element = selection && selection.getStartElement();
            if (element) {
                element = element.getAscendant("a", true);
            }
            if (!element || element.getName() !== "a") {
                element = editor.document.createElement("a");
                element.setAttribute("class", MICROFLOW_LINK_CLASS);
                element.setAttribute("href", "#");
                this.insertMode = true;
            } else {
                this.insertMode = false;
            }
            this.element = element;
            if (!this.insertMode) {
                this.setupContent(this.element);
            }
        },
        onOk(this: any) {
            const element = this.element;
            this.commitContent(element);
            if (this.insertMode) {
                editor.insertElement(element);
            }
        }
    };
}
