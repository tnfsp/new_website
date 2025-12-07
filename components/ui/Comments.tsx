/* Lightweight giscus embed. Requires Giscus env vars to be set; renders nothing if missing. */
"use client";

import { useEffect, useRef } from "react";

type Props = {
  term?: string;
};

const repo = process.env.NEXT_PUBLIC_GISCUS_REPO || "tnfsp/new_website";
const repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID;
const category = process.env.NEXT_PUBLIC_GISCUS_CATEGORY;
const categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID;

export function Comments({ term }: Props) {
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
    // Use pathname mapping by default; allow explicit term override.
    script.setAttribute("data-mapping", term ? "specific" : "pathname");
    if (term) script.setAttribute("data-term", term);
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "bottom");
    script.setAttribute("data-theme", "light");
    script.setAttribute("data-loading", "lazy");
    script.setAttribute("crossorigin", "anonymous");

    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(script);
    hasInjected.current = true;
  }, [term]);

  if (!repoId || !category || !categoryId) {
    return null;
  }

  return <div ref={containerRef} className="border-t border-[var(--border)] pt-6" />;
}
