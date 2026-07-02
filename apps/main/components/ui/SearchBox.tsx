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

// Pagefind 只載一次（module-level memoized promise）：
// 失敗（dev 沒跑 pagefind）也共用同一個 promise，不然每次打字都會重新輪詢。
let pagefindPromise: Promise<PagefindAPI | null> | null = null;

function loadPagefind(): Promise<PagefindAPI | null> {
  if (!pagefindPromise) {
    pagefindPromise = (async () => {
      try {
        // Use absolute URL for dynamic import (Turbopack doesn't support server-relative paths)
        const pagefindUrl = `${window.location.origin}/pagefind/pagefind.js`;
        const pagefind: PagefindAPI = await import(/* webpackIgnore: true */ pagefindUrl);
        await pagefind.init();
        return pagefind;
      } catch (err) {
        console.warn("Pagefind not available:", err);
        return null;
      }
    })();
  }
  return pagefindPromise;
}

export function SearchBox() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  // 遞增的 request id：舊查詢比新查詢慢回來時，直接丟棄，避免覆蓋新結果
  const requestIdRef = useRef(0);
  const wasOpenRef = useRef(false);

  // 開啟時 focus 輸入框；關閉時把 focus 還給觸發鈕（trigger 保持掛載才還得回去）
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    } else if (wasOpenRef.current) {
      triggerRef.current?.focus();
    }
    wasOpenRef.current = open;
  }, [open]);

  // 開啟時鎖住 body 捲動
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
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
    void loadPagefind();
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const requestId = ++requestIdRef.current;
    const isStale = () => requestIdRef.current !== requestId;

    const search = async () => {
      const pagefind = await loadPagefind();
      if (isStale()) return;

      if (!pagefind) {
        console.warn("Pagefind not loaded");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await pagefind.search(query);
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
        if (isStale()) return;
        setResults(items);
      } catch (err) {
        if (isStale()) return;
        console.error("Search error:", err);
        setResults([]);
      } finally {
        if (!isStale()) setLoading(false);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  // 最小 focus trap：Tab 在 modal 內循環
  const handleTrapKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !modalRef.current) return;
    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
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

      {open ? (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      onKeyDown={handleTrapKeyDown}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div
        ref={modalRef}
        className="relative w-full max-w-xl rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-2xl"
      >
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
      ) : null}
    </>
  );
}
