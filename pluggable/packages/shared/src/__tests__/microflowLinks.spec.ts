import {
    MICROFLOW_LINK_CLASS,
    migrateStoredValue,
    readMicroflowLink,
    sanitizeLegacyAnchor,
    serializeMicroflowLink
} from "../microflowLinks";

function anchorFrom(html: string): Element {
    const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
    return doc.body.firstElementChild as Element;
}

describe("readMicroflowLink", () => {
    it("returns null for a plain anchor", () => {
        expect(readMicroflowLink(anchorFrom(`<a href="/x">x</a>`))).toBeNull();
    });

    it("reads the new data-mf format", () => {
        const ref = readMicroflowLink(anchorFrom(`<a class="btn ${MICROFLOW_LINK_CLASS}" data-mf="DoThing">Go</a>`));
        expect(ref).toEqual({ functionName: "DoThing", legacy: false });
    });

    it("parses the legacy inline-onclick format", () => {
        const legacy = `<a href="__LINK__" class="btn ${MICROFLOW_LINK_CLASS}" onclick="CKEditorViewer.mf.exec('DoThing', '__ID__', '__GUID__');">Go</a>`;
        expect(readMicroflowLink(anchorFrom(legacy))).toEqual({
            functionName: "DoThing",
            legacy: true
        });
    });
});

describe("sanitizeLegacyAnchor", () => {
    it("moves the function name to data-mf and drops inline JS", () => {
        const el = anchorFrom(
            `<a href="__LINK__" class="btn ${MICROFLOW_LINK_CLASS}" onclick="CKEditorViewer.mf.exec('DoThing', '__ID__', '__GUID__');">Go</a>`
        );
        sanitizeLegacyAnchor(el);
        expect(el.getAttribute("data-mf")).toBe("DoThing");
        expect(el.hasAttribute("onclick")).toBe(false);
        expect(el.getAttribute("href")).toBe("#");
        expect(el.getAttribute("class")).toContain(MICROFLOW_LINK_CLASS);
    });
});

describe("serializeMicroflowLink", () => {
    it("emits the new format with merged classes", () => {
        const html = serializeMicroflowLink({
            functionName: "Fn",
            label: "Click <me>",
            cssClasses: "btn btn-primary",
            title: "t"
        });
        expect(html).toBe(
            `<a href="#" class="btn btn-primary ${MICROFLOW_LINK_CLASS}" data-mf="Fn" title="t">Click &lt;me&gt;</a>`
        );
    });
});

describe("migrateStoredValue", () => {
    it("is a no-op when there is nothing to migrate", () => {
        expect(migrateStoredValue(`<p>hi <a class="${MICROFLOW_LINK_CLASS}" data-mf="Fn">x</a></p>`)).toContain(
            'data-mf="Fn"'
        );
        expect(migrateStoredValue("")).toBe("");
    });

    it("rewrites legacy anchors in place", () => {
        const stored = `<p>Before <a href="__LINK__" class="btn ${MICROFLOW_LINK_CLASS}" onclick="CKEditorViewer.mf.exec('Fn', '__ID__', '__GUID__');">Go</a> after</p>`;
        const out = migrateStoredValue(stored);
        expect(out).toContain('data-mf="Fn"');
        expect(out).not.toContain("onclick");
        expect(out).not.toContain("__LINK__");
    });
});
