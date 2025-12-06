"use client";

import { useEffect, useRef, useState } from "react";

type Counts = { today: number | null; total: number | null };

function useViewCounts(slug: string) {
  const [counts, setCounts] = useState<Counts>({ today: null, total: null });
  const hasCounted = useRef(false);

  useEffect(() => {
    if (!slug || hasCounted.current) return;
    hasCounted.current = true;
    const controller = new AbortController();

    const run = async () => {
      try {
        const res = await fetch(`/api/views?slug=${encodeURIComponent(slug)}`, {
          method: "POST",
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { today?: number; total?: number };
        setCounts({
          today: typeof json.today === "number" ? json.today : null,
          total: typeof json.total === "number" ? json.total : null,
        });
      } catch (error) {
        console.warn("[view-counter] failed to record view:", (error as Error).message);
        setCounts({ today: 0, total: 0 });
      }
    };

    void run();

    return () => controller.abort();
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
