import "@testing-library/jest-dom";
import { render, cleanup } from "@testing-library/react";
import { MICROFLOW_LINK_CLASS } from "../microflowLinks";
import { MicroflowLinkBinding, RichTextView } from "../RichTextView";

afterEach(() => {
    cleanup();
    delete (globalThis as { mx?: unknown }).mx;
    delete (globalThis as { hljs?: unknown }).hljs;
});

function view(html: string, links: MicroflowLinkBinding[] = [], props: Partial<{ highlightCode: boolean }> = {}) {
    const utils = render(<RichTextView html={html} links={links} highlightCode={props.highlightCode} />);
    return { ...utils, anchor: () => utils.container.querySelector("a")! };
}

describe("RichTextView — microflow links", () => {
    it("wires a click to the matching binding and marks the link bound", () => {
        const execute = jest.fn();
        const { anchor } = view(`<a href="#" class="btn ${MICROFLOW_LINK_CLASS}" data-mf="Go">x</a>`, [{ name: "Go", execute }]);

        expect(anchor()).not.toHaveClass("mx-microflow-link--unbound");
        anchor().click();
        expect(execute).toHaveBeenCalledTimes(1);
    });

    it("prevents default navigation on click", () => {
        const execute = jest.fn();
        const { anchor } = view(`<a href="#" class="${MICROFLOW_LINK_CLASS}" data-mf="Go">x</a>`, [{ name: "Go", execute }]);
        const evt = new MouseEvent("click", { bubbles: true, cancelable: true });
        anchor().dispatchEvent(evt);
        expect(evt.defaultPrevented).toBe(true);
    });

    it("marks a link unbound when no binding matches", () => {
        const { anchor } = view(`<a class="${MICROFLOW_LINK_CLASS}" data-mf="Missing">x</a>`, [{ name: "Other", execute: jest.fn() }]);
        expect(anchor()).toHaveClass("mx-microflow-link--unbound");
        expect(() => anchor().click()).not.toThrow();
    });

    it("marks a link unbound when the binding has no executable action", () => {
        const { anchor } = view(`<a class="${MICROFLOW_LINK_CLASS}" data-mf="Go">x</a>`, [{ name: "Go", execute: undefined }]);
        expect(anchor()).toHaveClass("mx-microflow-link--unbound");
    });

    it("reads the legacy inline-onclick format too", () => {
        const execute = jest.fn();
        const { anchor } = view(
            `<a href="__LINK__" class="${MICROFLOW_LINK_CLASS}" onclick="CKEditorViewer.mf.exec('Legacy','__ID__','__GUID__');">x</a>`,
            [{ name: "Legacy", execute }]
        );
        anchor().click();
        expect(execute).toHaveBeenCalledTimes(1);
    });

    it("leaves a plain anchor alone", () => {
        const { anchor } = view(`<a href="/somewhere">x</a>`, []);
        expect(anchor().onclick).toBeNull();
        expect(anchor()).not.toHaveClass("mx-microflow-link--unbound");
    });

    it("re-wires when the html prop changes", () => {
        const execute = jest.fn();
        const { rerender, container } = render(
            <RichTextView html={`<a class="${MICROFLOW_LINK_CLASS}" data-mf="A">a</a>`} links={[{ name: "B", execute }]} />
        );
        rerender(<RichTextView html={`<a class="${MICROFLOW_LINK_CLASS}" data-mf="B">b</a>`} links={[{ name: "B", execute }]} />);
        container.querySelector("a")!.click();
        expect(execute).toHaveBeenCalledTimes(1);
    });
});

describe("RichTextView — images", () => {
    it("resolves data-image-guid via mx.data.getDocumentUrl", () => {
        (globalThis as { mx?: unknown }).mx = { data: { getDocumentUrl: (g: string) => `/doc/${g}` } };
        const { container } = view(`<p><img data-image-guid="12"></p>`);
        expect(container.querySelector("img")!.getAttribute("src")).toBe("/doc/12");
    });
});

describe("RichTextView — code highlighting", () => {
    it("calls hljs.highlightElement on pre code when highlightCode is set", () => {
        const highlightElement = jest.fn();
        (globalThis as { hljs?: unknown }).hljs = { highlightElement };
        view(`<pre><code class="language-js">const x = 1;</code></pre>`, [], { highlightCode: true });
        expect(highlightElement).toHaveBeenCalledTimes(1);
    });

    it("does nothing when highlightCode is false", () => {
        const highlightElement = jest.fn();
        (globalThis as { hljs?: unknown }).hljs = { highlightElement };
        view(`<pre><code>x</code></pre>`, [], { highlightCode: false });
        expect(highlightElement).not.toHaveBeenCalled();
    });

    it("does not throw when hljs is absent", () => {
        expect(() => view(`<pre><code>x</code></pre>`, [], { highlightCode: true })).not.toThrow();
    });
});

describe("RichTextView — clamping", () => {
    it("applies a line-clamp style when maxLines > 0", () => {
        const { container } = render(<RichTextView html="<p>x</p>" links={[]} maxLines={3} />);
        const root = container.firstElementChild as HTMLElement;
        // jsdom drops -webkit-line-clamp / -webkit-box-orient (unknown props);
        // the clamp is verified visually / in Playwright.
        expect(root.style.display).toBe("-webkit-box");
        expect(root.style.overflow).toBe("hidden");
    });

    it("applies no clamp style when maxLines is 0", () => {
        const { container } = render(<RichTextView html="<p>x</p>" links={[]} maxLines={0} />);
        expect((container.firstElementChild as HTMLElement).style.overflow).toBe("");
    });
});
