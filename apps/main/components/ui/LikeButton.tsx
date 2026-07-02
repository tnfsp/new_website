"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  slug: string;
  label?: string;
};

export function LikeButton({ slug, label = "Like" }: Props) {
  const [count, setCount] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // POST 完成後，比較慢回來的初始 GET 不能再覆蓋（GET 的 total 已經是舊的）
  const postCompleted = useRef(false);
  const storageKey = useMemo(() => `liked:${slug}`, [slug]);

  useEffect(() => {
    const likedFlag = typeof window !== "undefined" ? localStorage.getItem(storageKey) === "1" : false;
    setLiked(likedFlag);

    let cancelled = false;
    const controller = new AbortController();
    const fetchCounts = async () => {
      try {
        const res = await fetch(`/api/likes?slug=${encodeURIComponent(slug)}`, {
          method: "GET",
          signal: controller.signal,
        });
        // KV 失敗時 API 回 503：保持目前畫面，不要顯示 0
        if (!res.ok) return;
        const json = (await res.json()) as { total?: number };
        if (!cancelled && !postCompleted.current && typeof json.total === "number") {
          setCount(json.total);
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        console.warn("[like-button] failed to load likes:", (error as Error).message);
      }
    };
    void fetchCounts();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [slug, storageKey]);

  const handleClick = async () => {
    if (liked || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/likes?slug=${encodeURIComponent(slug)}`, { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { total?: number };
      const nextCount = typeof json.total === "number" ? json.total : (count ?? 0) + 1;
      postCompleted.current = true;
      setCount(nextCount);
      setLiked(true);
      if (typeof window !== "undefined") localStorage.setItem(storageKey, "1");
    } catch (error) {
      console.warn("[like-button] failed to submit like:", (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={liked || submitting}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors ${
        liked
          ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
          : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--accent)]"
      }`}
    >
      <span aria-hidden="true">{liked ? "♥" : "♡"}</span>
      <span>{label}</span>
      <span className="text-xs text-[var(--muted)]">{count ?? "…"}</span>
    </button>
  );
}
