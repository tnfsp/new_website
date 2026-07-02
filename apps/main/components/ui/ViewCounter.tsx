"use client";

import { useEffect, useRef, useState } from "react";

type Counts = { today: number | null; total: number | null };

function useViewCounts(slug: string) {
  const [counts, setCounts] = useState<Counts>({ today: null, total: null });
  // 記「上一次計數的 slug」而非 boolean：slug 換頁時才會重新計數
  const countedSlug = useRef<string | null>(null);

  useEffect(() => {
    if (!slug || countedSlug.current === slug) return;
    countedSlug.current = slug;
    const controller = new AbortController();
    let settled = false;

    const run = async () => {
      try {
        const res = await fetch(`/api/views?slug=${encodeURIComponent(slug)}`, {
          method: "POST",
          signal: controller.signal,
        });
        settled = true;
        // KV 失敗時 API 回 503：保持目前畫面，不要顯示 0
        if (!res.ok) return;
        const json = (await res.json()) as { today?: number; total?: number };
        setCounts({
          today: typeof json.today === "number" ? json.today : null,
          total: typeof json.total === "number" ? json.total : null,
        });
      } catch (error) {
        // 卸載時的 abort（StrictMode dev 會掛→卸→再掛）不是失敗，跳過即可
        if ((error as Error).name === "AbortError") return;
        settled = true;
        console.warn("[view-counter] failed to record view:", (error as Error).message);
      }
    };

    void run();

    return () => {
      controller.abort();
      // 請求沒完成就被卸載：清掉 ref，讓下一次掛載能重新計數
      if (!settled && countedSlug.current === slug) countedSlug.current = null;
    };
  }, [slug]);

  return counts;
}

type ViewCounterProps = {
  slug: string;
  label?: string;
};

export function ViewCounter({ slug, label = "瀏覽人次" }: ViewCounterProps) {
  const { total } = useViewCounts(slug);
  return (
    <span className="text-xs text-[var(--muted)]">
      {label}：{total !== null ? total : "…"}
    </span>
  );
}

type ViewStatsProps = {
  slug?: string;
  label?: string;
};

// Server-backed stats (KV if configured; otherwise in-memory fallback).
export function ViewStats({ slug = "home", label = "瀏覽人次" }: ViewStatsProps) {
  const { today, total } = useViewCounts(slug);
  return (
    <div className="flex flex-wrap gap-3 text-xs text-[var(--muted)]">
      <span>{label}</span>
      <span>今日：{today !== null ? today : "…"}</span>
      <span>總計：{total !== null ? total : "…"}</span>
    </div>
  );
}
