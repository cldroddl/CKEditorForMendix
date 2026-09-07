import { CSSProperties, ReactElement, useCallback, useEffect, useRef } from "react";
import { readMicroflowLink } from "./microflowLinks";
import { resolveImageUrls } from "./imageUrls";

export interface MicroflowLinkBinding {
    /** `functionName` as configured in the widget's microflow-links list. */
    name: string;
    /** Fires the mapped microflow; undefined when not executable right now. */
    execute?: () => void;
}

export interface RichTextViewProps {
    /**
     * Stored HTML from the attribute. The caller is responsible for running
     * `migrateStoredValue` and (for untrusted content) `sanitizeRichText` first —
     * this component renders the string as-is via `dangerouslySetInnerHTML`.
     */
    html: string;
    /** Bindings resolved from the widget's `microflowLinks` list. */
    links: MicroflowLinkBinding[];
    /** Max lines before clamping (0 = no clamp). */
    maxLines?: number;
    /** Highlight `pre code` blocks using highlight.js if present on the page. */
    highlightCode?: boolean;
    className?: string;
}

/**
 * Renders rich-text HTML (already migrated / sanitized by the caller) and
 * re-attaches microflow-link click behaviour without any inline JS.
 */
export function RichTextView({
    html,
    links,
    maxLines = 0,
    highlightCode = false,
    className
}: RichTextViewProps): ReactElement {
    const containerRef = useRef<HTMLDivElement>(null);

    const wireUp = useCallback(() => {
        const root = containerRef.current;
        if (!root) {
            return;
        }

        resolveImageUrls(root);

        root.querySelectorAll<HTMLAnchorElement>("a").forEach(anchor => {
            const ref = readMicroflowLink(anchor);
            if (!ref) {
                return;
            }
            const binding = links.find(l => l.name === ref.functionName);
            anchor.classList.toggle("mx-microflow-link--unbound", !binding?.execute);
            anchor.onclick = event => {
                event.preventDefault();
                binding?.execute?.();
            };
        });

        if (highlightCode) {
            highlightBlocks(root);
        }
    }, [links, highlightCode]);

    useEffect(() => {
        wireUp();
    }, [html, wireUp]);

    const style: CSSProperties | undefined =
        maxLines > 0
            ? {
                  display: "-webkit-box",
                  WebkitLineClamp: maxLines,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden"
              }
            : undefined;

    return (
        <div
            ref={containerRef}
            className={className}
            style={style}
            // `html` is sanitized upstream (RichTextViewer -> sanitizeRichText).
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}

function highlightBlocks(root: ParentNode): void {
    const hljs = (globalThis as { hljs?: { highlightElement?: (el: Element) => void } }).hljs;
    if (!hljs?.highlightElement) {
        return;
    }
    root.querySelectorAll("pre code").forEach(block => hljs.highlightElement!(block));
}
