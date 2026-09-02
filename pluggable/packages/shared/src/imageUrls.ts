/**
 * The stored HTML from the old widget keeps image references as relative
 * `file?guid=<n>` (or `file?target=internal&guid=<n>`) URLs, plus a
 * `data-image-guid` attribute. At render time those must be resolved to a real,
 * cache-busted document URL against the running app.
 *
 * `mx.data.getDocumentUrl` exists on Mendix 8+; the manual fallback matches what
 * the Dojo viewer did.
 */

interface MxGlobal {
    appUrl?: string;
    data?: {
        getDocumentUrl?: (guid: string, changedDate: number, thumb: boolean) => string;
    };
}

function mxGlobal(): MxGlobal | undefined {
    return (globalThis as { mx?: MxGlobal }).mx;
}

export function getFileUrl(guid: string): string {
    const changedDate = Date.now();
    const mx = mxGlobal();
    if (mx?.data?.getDocumentUrl) {
        return mx.data.getDocumentUrl(guid, changedDate, false);
    }
    const base = mx?.appUrl ?? "";
    return `${base}file?guid=${encodeURIComponent(guid)}&changedDate=${changedDate}`;
}

/** Resolve `data-image-guid` / `file?guid=` image sources inside a container. */
export function resolveImageUrls(container: ParentNode): void {
    container.querySelectorAll<HTMLImageElement>("img").forEach(img => {
        const guid = img.getAttribute("data-image-guid");
        if (guid) {
            img.src = getFileUrl(guid);
            return;
        }
        const src = img.getAttribute("src");
        const match = src ? /(?:^|[?&])guid=(\d+)/.exec(src) : null;
        if (src && match && (src.startsWith("file?") || src.includes("/file?"))) {
            img.src = getFileUrl(match[1]);
        }
    });
}
