"use client";

import { useEffect, useRef, useState } from "react";

type PagefindAPI = {
  init: () => Promise<void>;
  search: (query: string) => Promise<{
    results: Array<{
      id: string;
      data: () => Promise<{
        url: string;
        meta: { title?: string };
        excerpt: string;
      }>;
    }>;
  }>;
};

type SearchResult = {
  id: string;
  url: string;
  title: string;
  excerpt: string;
};

export function SearchBox() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pagefindRef = useRef<PagefindAPI | null>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (pagefindRef.current) return;

    const loadPagefind = async () => {
      try {
        // Dynamic import for ES Module (file exists at runtime in public/)
        // @ts-expect-error - Pagefind is generated at build time
        const pagefind: PagefindAPI = await import("/pagefind/pagefind.js");
        await pagefind.init();
        pagefindRef.current = pagefind;
      } catch (err) {
        console.warn("Pagefind not available:", err);
      }
    };
    loadPagefind();
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const search = async () => {
      // Wait for pagefind to be ready
      let attempts = 0;
      while (!pagefindRef.current && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!pagefindRef.current) {
        console.warn("Pagefind not loaded after waiting");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await pagefindRef.current.search(query);
        const items = await Promise.all(
          response.results.slice(0, 8).map(async (result) => {
            const data = await result.data();
            return {
              id: result.id,
              url: data.url,
              title: data.meta?.title || "Untitled",
              excerpt: data.excerpt,
            };
          })
        );
        setResults(items);
      } catch (err) {
        console.error("Search error:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-full px-2 py-1 text-sm text-[var(--muted)] transition-colors hover:bg-[var(--highlight)]/60 hover:text-[var(--accent)]"
        aria-label="Search"
        title="Search (Ctrl+K)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="relative w-full max-w-xl rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-2xl">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
        />
        {loading && (
          <div className="mt-4 text-center text-sm text-[var(--muted)]">Searching...</div>
        )}
        {!loading && results.length > 0 && (
          <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto">
            {results.map((result) => (
              <li key={result.id}>
                <a
                  href={result.url}
                  className="block rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] p-3 transition-colors hover:border-[var(--accent)]"
                  onClick={() => setOpen(false)}
                >
                  <div className="font-medium text-[var(--foreground)]">{result.title}</div>
                  <div
                    className="mt-1 text-sm text-[var(--muted)] [&_mark]:bg-[var(--highlight)] [&_mark]:text-[var(--foreground)]"
                    dangerouslySetInnerHTML={{ __html: result.excerpt }}
                  />
                </a>
              </li>
            ))}
          </ul>
        )}
        {!loading && query && results.length === 0 && (
          <div className="mt-4 text-center text-sm text-[var(--muted)]">No results found</div>
        )}
        <div className="mt-4 text-center text-xs text-[var(--muted)]">
          Press <kbd className="rounded border border-[var(--border)] px-1">Esc</kbd> to close
        </div>
      </div>
    </div>
  );
}
