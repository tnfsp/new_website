/* Lightweight giscus embed. Requires Giscus env vars to be set; renders nothing if missing. */
"use client";

import { useEffect, useRef } from "react";

const repo = process.env.NEXT_PUBLIC_GISCUS_REPO || "tnfsp/new_website";
const repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID;
const category = process.env.NEXT_PUBLIC_GISCUS_CATEGORY;
const categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID;
const theme = process.env.NEXT_PUBLIC_GISCUS_THEME || "preferred_color_scheme";
const lang = process.env.NEXT_PUBLIC_GISCUS_LANG || "zh-TW";
const strict = process.env.NEXT_PUBLIC_GISCUS_STRICT || "0";
const mapping = process.env.NEXT_PUBLIC_GISCUS_MAPPING || "pathname";

export function Comments() {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasInjected = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;
    if (hasInjected.current) return;
    if (!repoId || !category || !categoryId) return;

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.setAttribute("data-repo", repo);
    script.setAttribute("data-repo-id", repoId);
    script.setAttribute("data-category", category);
    script.setAttribute("data-category-id", categoryId);
    script.setAttribute("data-mapping", mapping);
    script.setAttribute("data-strict", strict);
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "bottom");
    script.setAttribute("data-theme", theme);
    script.setAttribute("data-lang", lang);
    script.setAttribute("data-loading", "lazy");
    script.setAttribute("crossorigin", "anonymous");

    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(script);
    hasInjected.current = true;
  }, []);

  if (!repoId || !category || !categoryId) {
    return null;
  }

  return <div ref={containerRef} className="border-t border-[var(--border)] pt-6" />;
}
