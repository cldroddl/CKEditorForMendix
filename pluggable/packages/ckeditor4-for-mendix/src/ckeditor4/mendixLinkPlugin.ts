/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * CKEditor 4 "mendixlink" plugin — inserts / edits an anchor that the Rich Text
 * Viewer turns into a microflow trigger.
 *
 * Ported from the legacy Dojo widget's
 * `src/CKEditorForMendix/widget/lib/plugins/mendixlink/{plugin,dialogs/mendixlink}.js`,
 * but it writes the NEW wire format used by @ckeditor4formendix/shared:
 *
 *     <a href="#" class="<css> mx-microflow-link" data-mf="<linkName>" title="<title>">Label</a>
 *
 * (no inline `onclick` — that won't run under the React viewer and is CSP-hostile).
 *
 * Register once, after the CKEditor 4 script has loaded, before creating an editor.
 * Configured link names are passed via `config.mendixLink = { links: [{ name }] }`.
 */

import { MICROFLOW_LINK_CLASS } from "@ckeditor4formendix/shared";

export const MENDIX_LINK_PLUGIN = "mendixlink";

/**
 * Toolbar / context-menu icon — the legacy "mx" mark
 * (`src/CKEditorForMendix/widget/lib/plugins/mendixlink/icons/mendixlink.png`,
 * stripped of Adobe metadata: 49 KB → 618 B).
 *
 * The legacy plugin loaded that PNG from its own folder; this plugin is
 * registered in JS (no folder, no path), so CKEditor's icon machinery can't
 * resolve one and the button rendered blank. CKEditor 4's `getUrl()` also
 * mangles a `data:` URI passed as `icon` (prepends basePath + appends `?t=`), so
 * instead we give the button a plain icon *name* ("mendixlink" → class
 * `.cke_button__mendixlink_icon`, shared by the toolbar button and the
 * context-menu item) and style that class ourselves with the PNG data URI
 * injected into the top document.
 */
const ICON_NAME = "mendixlink";
const ICON_DATA_URI =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACMUlEQVQ4jaVTz0sbYRB987mun0u6JT/EsOxmSwyhiCcPZvFWCEKvPQq5+Af0Wm89CPVv8FbiuceChdJSrIEVhbZEDz2lzaEgUhFK3Gz0ez24lrR4qgOPgYE3M7x5IyRxl1B3YgOQWq1GYww8z3t7dHTUFJHLWq326Pz8fLvX6z1YWFh4U61WoziO75fL5Z39/f3HS0tLrdPT07bruoCIUERYLBY/53K5jlKKpVLpl+/7723bHjiOw5WVlY+2bdN13YuNjY2653lfLcu6bDQaLyAinJycZLPZfJrP50siwtnZ2Z8AUCwWPyil6Hnek2q1+hIAgyDoiQh9338NAEqpaxkmJibunZ2d5QBAREyWRUQwGAz02tras0KhMOr3+6HrulheXn4OAMoYA5Iw5pqTXUUAgKRkzdnpdK7SNAUAGGNwcnKSqShCy7IYhuErAF8A8AbT09PflFIcr9m2PQDAcrm886eBUopzc3M/0jTtD4dDpmlKksMwDBkEAUejkcnqxhjTD4LgyrIsNhqNbUxNTVEpxW6329VafxqfFkURoyj6awOtdby3t/ddRDgzM0OQRKFQIMmoUqkwSZJDksPbkCTJYaVSIcko41w70XGcYxExvu8faK0XRcS+DVrrRd/3D0TEOI5zjExptFqtLQC7JONs2gXJi3q9znq9zn82iQHstlqtLZKwAKDdbsfz8/MPRUQDsG98vrq6+g6AEZHmmP315uZmsr6+Ho/f/b/jzt/4G9P0Kf+E42hSAAAAAElFTkSuQmCC";

let iconCssInjected = false;

function injectIconCss(): void {
    if (iconCssInjected || typeof document === "undefined") {
        return;
    }
    iconCssInjected = true;
    const style = document.createElement("style");
    style.dataset.mendixlink = "icon";
    // Two-class selector so it outweighs moono-lisa's per-button `.cke_button__x_icon`
    // sprite rules regardless of stylesheet insertion order.
    style.textContent =
        `.cke_button_icon.cke_button__${ICON_NAME}_icon,` +
        `.cke_menubutton_icon .cke_button__${ICON_NAME}_icon{` +
        `background:url("${ICON_DATA_URI}") center/16px 16px no-repeat!important}`;
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
