"use client";

import { useEffect } from "react";

type PageMetaOptions = {
    title: string;
    themeColor?: string;
    description?: string;
    faviconLetter?: string;
};

export function usePageMeta(opts: PageMetaOptions) {
    const { title, themeColor = "#000", description, faviconLetter } = opts;

    useEffect(() => {
        document.title = title;

        const setMeta = (key: string, val: string, prop = false) => {
            let el = document.querySelector(prop ? `meta[property="${key}"]` : `meta[name="${key}"]`) as HTMLMetaElement;
            if (!el) {
                el = document.createElement("meta");
                prop ? el.setAttribute("property", key) : (el.name = key);
                document.head.appendChild(el);
            }
            el.content = val;
        };

        const setLink = (rel: string, href: string, options: { type?: string } = {}) => {
            let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
            if (!el) {
                el = document.createElement("link");
                el.rel = rel;
                document.head.appendChild(el);
            }
            if (options.type) el.type = options.type;
            el.href = href;
        };

        if (faviconLetter) {
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="${themeColor}"/><text x="12" y="17.5" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-weight="900" font-size="15" fill="white">${faviconLetter}</text></svg>`;
            const dataUri = `data:image/svg+xml,${encodeURIComponent(svg)}`;
            setLink("icon", dataUri, { type: "image/svg+xml" });
        }

        setMeta("theme-color", themeColor);
        if (description) setMeta("description", description);
        setMeta("og:title", title, true);
    }, [title, themeColor, description, faviconLetter]);
}
