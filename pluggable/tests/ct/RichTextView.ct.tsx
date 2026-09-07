import { expect, test } from "@playwright/experimental-ct-react";
import { RichTextView } from "../../packages/shared/src/RichTextView";

// Real-browser coverage of the viewer's post-render DOM wiring (click semantics,
// `dangerouslySetInnerHTML` + effect ordering). The pure-logic equivalents live
// in `packages/shared/src/__tests__/RichTextView.spec.tsx` (jsdom).

const LINK = (mf: string) => `<a href="#" class="btn mx-microflow-link" data-mf="${mf}">click</a>`;

test("fires the matching microflow binding on click and marks the link bound", async ({ mount }) => {
    let fired = 0;
    const component = await mount(
        <RichTextView
            html={`<p>before ${LINK("Go")} after</p>`}
            links={[{ name: "Go", execute: () => (fired += 1) }]}
        />
    );

    const anchor = component.locator("a.mx-microflow-link");
    await expect(anchor).not.toHaveClass(/mx-microflow-link--unbound/);
    await anchor.click();
    expect(fired).toBe(1);
});

test("marks an unmapped link unbound and swallows the click", async ({ mount }) => {
    const component = await mount(
        <RichTextView html={LINK("Missing")} links={[{ name: "Other", execute: () => {} }]} />
    );
    const anchor = component.locator("a.mx-microflow-link");
    await expect(anchor).toHaveClass(/mx-microflow-link--unbound/);
    await anchor.click(); // must not navigate / throw
    await expect(anchor).toBeVisible();
});

test("renders plain HTML and leaves non-link anchors alone", async ({ mount }) => {
    const component = await mount(
        <RichTextView html={`<h2>Title</h2><p>Body <a href="https://example.test">ext</a></p>`} links={[]} />
    );
    await expect(component.locator("h2")).toHaveText("Title");
    await expect(component.locator('a[href="https://example.test"]')).toHaveText("ext");
});

test("clamps to maxLines with a -webkit-line-clamp box", async ({ mount }) => {
    // maxLines styles the component's own root div.
    const component = await mount(<RichTextView html={"<p>" + "word ".repeat(400) + "</p>"} links={[]} maxLines={2} />);
    await expect(component).toHaveCSS("-webkit-line-clamp", "2");
    await expect(component).toHaveCSS("overflow", "hidden");
});
