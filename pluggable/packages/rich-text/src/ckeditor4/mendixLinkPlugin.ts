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

/**
 * Toolbar / context-menu icon. The legacy plugin loaded `icons/mendixlink.png`
 * from its own folder; this plugin is registered in JS (no folder, no path), so
 * CKEditor's icon machinery can't resolve one and the button rendered blank.
 *
 * CKEditor 4's `getUrl()` mangles a `data:` URI passed as `icon` (prepends
 * basePath + appends `?t=`), so instead we give the button a plain icon *name*
 * ("mendixlink" → class `.cke_button__mendixlink_icon`, shared by the toolbar
 * button and the context-menu item) and style that class ourselves with an
 * inline SVG data URI injected into the top document. Chain link in Mendix blue
 * — reads as a link, distinct from the grey Link button beside it.
 */
const ICON_NAME = "mendixlink";
const ICON_SVG =
    "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' " +
    "stroke='#2680eb' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'>" +
    "<path d='M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71'/>" +
    "<path d='M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'/></svg>";
const ICON_DATA_URI = `data:image/svg+xml,${encodeURIComponent(ICON_SVG)}`;

let iconCssInjected = false;

function injectIconCss(): void {
    if (iconCssInjected || typeof document === "undefined") {
        return;
    }
    iconCssInjected = true;
    const style = document.createElement("style");
    style.dataset.mendixlink = "icon";
    style.textContent =
        `.cke_button__${ICON_NAME}_icon{` +
        `background:url("${ICON_DATA_URI}") center no-repeat!important;background-size:16px!important}`;
    document.head.appendChild(style);
}

export function registerMendixLinkPlugin(): void {
    injectIconCss();

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
                toolbar: "links",
                icon: ICON_NAME
            });

            if (editor.contextMenu) {
                editor.addMenuGroup("mendixlinkGroup");
                editor.addMenuItem("mendixlinkItem", {
                    label: "Edit Mendix link",
                    command: "insertMendixLink",
                    group: "mendixlinkGroup",
                    icon: ICON_NAME
                });
                editor.contextMenu.addListener((element: any) => {
                    const anchor = element && element.getAscendant("a", true);
                    if (anchor && String(anchor.getAttribute("class") || "").indexOf(MICROFLOW_LINK_CLASS) !== -1) {
                        return { mendixlinkItem: CKEDITOR.TRISTATE_OFF };
                    }
                    return null;
                });
            }

            // Bind to the editor CKEditor passes at open time, NOT `init`'s `editor`:
            // dialog.add(name, fn) overwrites the page-global definition on every init, so with
            // 2+ RichText widgets a closure over `init`'s editor would make every dialog operate
            // on the last-mounted editor.
            CKEDITOR.dialog.add("mendixLinkDialog", (dialogEditor: any) => buildDialog(dialogEditor));
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
