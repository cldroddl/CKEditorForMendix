import { getFileUrl, resolveImageUrls } from "../imageUrls";

interface MxStub {
    appUrl?: string;
    data?: { getDocumentUrl?: jest.Mock };
}

function setMx(mx: MxStub | undefined): void {
    (globalThis as { mx?: MxStub }).mx = mx;
}

function container(html: string): HTMLElement {
    const el = document.createElement("div");
    el.innerHTML = html;
    return el;
}

afterEach(() => setMx(undefined));

describe("getFileUrl", () => {
    it("uses mx.data.getDocumentUrl when available", () => {
        const getDocumentUrl = jest.fn().mockReturnValue("/resolved/doc");
        setMx({ data: { getDocumentUrl } });

        expect(getFileUrl("42")).toBe("/resolved/doc");
        expect(getDocumentUrl).toHaveBeenCalledWith("42", expect.any(Number), false);
    });

    it("falls back to appUrl + file?guid= with a cache-buster", () => {
        setMx({ appUrl: "https://app.example/" });
        const url = getFileUrl("7");
        expect(url).toMatch(/^https:\/\/app\.example\/file\?guid=7&changedDate=\d+$/);
    });

    it("falls back to a bare relative URL when mx is absent", () => {
        expect(getFileUrl("9")).toMatch(/^file\?guid=9&changedDate=\d+$/);
    });

    it("url-encodes the guid in the fallback", () => {
        setMx({ appUrl: "" });
        expect(getFileUrl("a/b")).toContain("guid=a%2Fb");
    });
});

describe("resolveImageUrls", () => {
    beforeEach(() => setMx({ data: { getDocumentUrl: jest.fn((g: string) => `/doc/${g}`) } }));

    it("resolves data-image-guid, ignoring any existing src", () => {
        const root = container(`<img data-image-guid="5" src="stale">`);
        resolveImageUrls(root);
        expect(root.querySelector("img")!.getAttribute("src")).toBe("/doc/5");
    });

    it("resolves a relative file?guid= src", () => {
        const root = container(`<img src="file?guid=7">`);
        resolveImageUrls(root);
        expect(root.querySelector("img")!.getAttribute("src")).toBe("/doc/7");
    });

    it("resolves file?target=internal&guid= src", () => {
        const root = container(`<img src="file?target=internal&guid=9">`);
        resolveImageUrls(root);
        expect(root.querySelector("img")!.getAttribute("src")).toBe("/doc/9");
    });

    it("resolves a path-prefixed /file?guid= src", () => {
        const root = container(`<img src="/sub/file?guid=3">`);
        resolveImageUrls(root);
        expect(root.querySelector("img")!.getAttribute("src")).toBe("/doc/3");
    });

    it("leaves an unrelated absolute src untouched", () => {
        const root = container(`<img src="https://cdn.example/pic.png">`);
        resolveImageUrls(root);
        expect(root.querySelector("img")!.getAttribute("src")).toBe("https://cdn.example/pic.png");
    });

    it("leaves a base64 data: src untouched", () => {
        const src = "data:image/png;base64,iVBORw0KGgo=";
        const root = container(`<img src="${src}">`);
        resolveImageUrls(root);
        expect(root.querySelector("img")!.getAttribute("src")).toBe(src);
    });

    it("does nothing for a container without images", () => {
        const root = container(`<p>no images here</p>`);
        expect(() => resolveImageUrls(root)).not.toThrow();
    });
});
