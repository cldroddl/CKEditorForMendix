import { MICROFLOW_LINK_CLASS, migrateStoredValue, sanitizeRichText } from "../index";

/** Parse sanitized output so structural checks don't depend on attribute order / quoting. */
function parse(html: string): HTMLElement {
    return new DOMParser().parseFromString(`<body>${html}</body>`, "text/html").body;
}

describe("sanitizeRichText — strips hostile markup", () => {
    it("removes <script> and its contents", () => {
        const out = sanitizeRichText(`<p>ok</p><script>window.__pwned = 1;</script>`);
        expect(out).not.toMatch(/<script/i);
        expect(out).not.toContain("__pwned");
        expect(out).toContain("<p>ok</p>");
    });

    it("removes inline event handlers", () => {
        const out = sanitizeRichText(`<img src="x" onerror="window.__pwned = 1">`);
        expect(out).toMatch(/<img/i);
        expect(out).not.toMatch(/onerror/i);
    });

    it("removes javascript: URLs", () => {
        const out = sanitizeRichText(`<a href="javascript:window.__pwned=1">x</a>`);
        expect(out).not.toMatch(/javascript:/i);
    });

    it("removes <style> blocks and their CSS text", () => {
        const out = sanitizeRichText(`<style>body{display:none}</style><p>ok</p>`);
        expect(out).not.toMatch(/<style/i);
        expect(out).not.toContain("display:none");
        expect(out).toContain("<p>ok</p>");
    });

    it("drops <iframe> (embed policy: remove)", () => {
        const out = sanitizeRichText(
            `<div class="embededContent"><iframe src="https://www.youtube.com/embed/x"></iframe></div>`
        );
        expect(out).not.toMatch(/<iframe/i);
        expect(parse(out).querySelector("div.embededContent")).not.toBeNull();
    });

    it("strips a data:image/svg+xml src on <img> but keeps the element", () => {
        const out = sanitizeRichText(`<img src="data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=">`);
        const img = parse(out).querySelector("img");
        expect(img).not.toBeNull();
        expect(img?.hasAttribute("src")).toBe(false);
        expect(out).not.toMatch(/svg\+xml/i);
    });

    it("drops inline <svg>", () => {
        const out = sanitizeRichText(`<p>a</p><svg onload="window.__pwned=1"><circle r="1"/></svg>`);
        expect(out).not.toMatch(/<svg/i);
        expect(out).not.toMatch(/onload/i);
    });
});

describe("sanitizeRichText — preserves widget markup", () => {
    it("keeps a microflow-link anchor intact", () => {
        const a = parse(
            sanitizeRichText(
                `<a href="#" class="btn btn-default ${MICROFLOW_LINK_CLASS}" data-mf="DoThing" title="t">Go</a>`
            )
        ).querySelector("a")!;
        expect(a.getAttribute("data-mf")).toBe("DoThing");
        expect(a.getAttribute("href")).toBe("#");
        expect(a.getAttribute("title")).toBe("t");
        expect(a.classList.contains(MICROFLOW_LINK_CLASS)).toBe(true);
    });

    it("keeps data-image-guid and a relative file? src", () => {
        const img = parse(
            sanitizeRichText(`<img data-image-guid="123" src="file?guid=123&changedDate=1">`)
        ).querySelector("img")!;
        expect(img.getAttribute("data-image-guid")).toBe("123");
        expect(img.getAttribute("src")).toMatch(/^file\?guid=123/);
    });

    it("keeps a base64 raster image", () => {
        const src = "data:image/png;base64,iVBORw0KGgo=";
        const img = parse(sanitizeRichText(`<img src="${src}">`)).querySelector("img")!;
        expect(img.getAttribute("src")).toBe(src);
    });

    it("keeps a code block with its language class", () => {
        const code = parse(sanitizeRichText(`<pre><code class="language-js">const x = 1;</code></pre>`)).querySelector(
            "pre > code"
        )!;
        expect(code.getAttribute("class")).toBe("language-js");
    });

    it("keeps table structure and sizing attributes", () => {
        const out = sanitizeRichText(
            `<table border="1" cellpadding="4" style="width:100%"><colgroup><col style="width:50%"></colgroup>` +
                `<tbody><tr><th scope="col" colspan="2">H</th></tr></tbody></table>`
        );
        const doc = parse(out);
        expect(doc.querySelector("table")?.getAttribute("border")).toBe("1");
        expect(doc.querySelector("table")?.getAttribute("cellpadding")).toBe("4");
        expect(doc.querySelector("col")?.getAttribute("style")).toContain("width");
        const th = doc.querySelector("th")!;
        expect(th.getAttribute("scope")).toBe("col");
        expect(th.getAttribute("colspan")).toBe("2");
    });

    it("keeps inline style: colour, font, alignment, spacing", () => {
        const out = sanitizeRichText(
            `<span style="color:#ff0000;background-color:#00ff00;font-family:Arial;font-size:14px">x</span>` +
                `<p style="text-align:center;margin-left:40px">y</p>`
        );
        expect(out).toMatch(/color/);
        expect(out).toMatch(/background-color/);
        expect(out).toMatch(/font-family/);
        expect(out).toMatch(/font-size/);
        expect(out).toMatch(/text-align/);
        expect(out).toMatch(/margin-left/);
    });

    it("keeps form controls (legacy 'forms' plugin parity)", () => {
        const out = sanitizeRichText(`<form><label>N<input type="text" name="n"></label><button>go</button></form>`);
        const doc = parse(out);
        expect(doc.querySelector("form")).not.toBeNull();
        expect(doc.querySelector('input[type="text"]')).not.toBeNull();
        expect(doc.querySelector("button")).not.toBeNull();
    });

    it("adds rel=noopener noreferrer to target=_blank links", () => {
        const a = parse(sanitizeRichText(`<a href="https://example.test" target="_blank">x</a>`)).querySelector("a")!;
        expect(a.getAttribute("rel")).toBe("noopener noreferrer");
    });
});

describe("sanitizeRichText — ordering and edge cases", () => {
    const LEGACY =
        `<a href="__LINK__" class="btn ${MICROFLOW_LINK_CLASS}" ` +
        `onclick="CKEditorViewer.mf.exec('Fn', '__ID__', '__GUID__');">Go</a>`;

    it("migrate-then-sanitize keeps the microflow binding", () => {
        const out = sanitizeRichText(migrateStoredValue(LEGACY));
        expect(out).toContain('data-mf="Fn"');
        expect(out).toMatch(new RegExp(MICROFLOW_LINK_CLASS));
        expect(out).not.toMatch(/onclick/i);
        expect(out).not.toContain("__LINK__");
    });

    it("sanitize alone (no prior migrate) loses the legacy binding — proves ordering matters", () => {
        const out = sanitizeRichText(LEGACY);
        expect(out).not.toContain("data-mf");
        expect(out).not.toMatch(/onclick/i);
    });

    it("returns empty / falsy input unchanged and never throws", () => {
        expect(sanitizeRichText("")).toBe("");
        expect(() => sanitizeRichText(undefined as unknown as string)).not.toThrow();
    });

    it("is idempotent", () => {
        for (const input of [
            `<a href="#" class="${MICROFLOW_LINK_CLASS}" data-mf="Fn">x</a>`,
            `<table border="1"><tbody><tr><td>c</td></tr></tbody></table>`,
            `<span style="color:#f00">x</span>`
        ]) {
            const once = sanitizeRichText(input);
            expect(sanitizeRichText(once)).toBe(once);
        }
    });
});
