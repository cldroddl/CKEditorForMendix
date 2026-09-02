import { Plugin } from "ckeditor5";
import { MendixLinkEditing } from "./MendixLinkEditing";
import { MendixLinkUI } from "./MendixLinkUI";

export class MendixLink extends Plugin {
    static get requires(): readonly [typeof MendixLinkEditing, typeof MendixLinkUI] {
        return [MendixLinkEditing, MendixLinkUI];
    }

    static get pluginName(): "MendixLink" {
        return "MendixLink";
    }
}

export { MendixLinkEditing } from "./MendixLinkEditing";
export { MendixLinkUI } from "./MendixLinkUI";
export { MendixLinkCommand } from "./MendixLinkCommand";
export type { ConfiguredMendixLink } from "./MendixLinkUI";
