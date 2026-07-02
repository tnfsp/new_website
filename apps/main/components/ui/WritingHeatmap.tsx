"use client";

import { useEffect, useState, useRef } from "react";

type BlogEntry = { date: string; slug: string; title: string };

const CELL = 13;
const GAP = 3;
const SIZE = CELL + GAP;

const COLORS = {
  empty: "var(--border)",
  filled: "var(--accent)",
};

const MONTHS_ZH = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
const DAYS_ZH = ["", "一", "", "三", "", "五", ""];

function formatDate(d: Date): string {
  // 用 local 日期組 key——cursor 是 local 午夜，toISOString() 會轉成 UTC，
  // 對 UTC+8 的訪客（也就是主要讀者）來說每一格都會偏移一天
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function WritingHeatmap({ weeks = 52 }: { weeks?: number }) {
  const [entries, setEntries] = useState<BlogEntry[] | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    entry: BlogEntry;
    date: string;
    flipDown: boolean;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/writing-calendar.json")
      .then((r) => r.json())
      .then((data) => setEntries(data.entries))
      .catch(() => setEntries([]));
  }, []);

  if (!entries) return null;

  // Build date → entries map
  const dateMap = new Map<string, BlogEntry[]>();
  for (const e of entries) {
    const arr = dateMap.get(e.date) || [];
    arr.push(e);
    dateMap.set(e.date, arr);
  }

  // Build grid
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDay = new Date(today);
  startDay.setDate(startDay.getDate() - (weeks * 7 - 1) - startDay.getDay());

  const LABEL_W = 22;
  const LABEL_H = 16;

  const grid: { date: string; col: number; row: number; entries: BlogEntry[] }[] = [];
  const cursor = new Date(startDay);
  let col = 0;

  const monthLabels: { col: number; label: string }[] = [];
  let lastMonth = -1;

  while (cursor <= today) {
    const row = cursor.getDay();
    if (row === 0 && grid.length > 0) col++;

    const ds = formatDate(cursor);
    const m = cursor.getMonth();
    if (m !== lastMonth) {
      monthLabels.push({ col, label: MONTHS_ZH[m] });
      lastMonth = m;
    }

    grid.push({
      date: ds,
      col,
      row,
      entries: dateMap.get(ds) || [],
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  const totalCols = col + 1;
  const svgWidth = LABEL_W + totalCols * SIZE;
  const svgHeight = LABEL_H + 7 * SIZE;

  function handleClick(cellEntries: BlogEntry[]) {
    if (cellEntries.length >= 1) {
      window.location.assign(`/blog/${cellEntries[0].slug}`);
    }
  }

  function handleMouseEnter(e: React.MouseEvent, cellEntries: BlogEntry[], date: string) {
    if (cellEntries.length === 0) return;
    const rect = (e.target as SVGElement).getBoundingClientRect();
    const containerEl = containerRef.current;
    if (!containerEl) return;
    const containerRect = containerEl.getBoundingClientRect();

    const x = rect.left - containerRect.left + CELL / 2;
    const y = rect.top - containerRect.top;

    // If tooltip would go above container, flip it below the cell
    const flipDown = y < 40;

    setTooltip({
      x,
      y: flipDown ? y + CELL + 6 : y - 4,
      entry: cellEntries[0],
      date,
      flipDown,
    });
  }

  return (
    <div
      className="mt-4 border border-[var(--border)] rounded-lg p-4"
      ref={containerRef}
      style={{ position: "relative" }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[var(--muted)]">
          📝 {entries.length} 篇文章的寫作紀錄
        </span>
      </div>
      <div className="overflow-x-auto">
        <svg
          ref={svgRef}
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="block"
          role="img"
          aria-label="寫作日曆"
          onMouseLeave={() => setTooltip(null)}
        >
          {/* Month labels */}
          {monthLabels.map((ml, i) => (
            <text
              key={`m-${i}`}
              x={LABEL_W + ml.col * SIZE}
              y={12}
              fontSize={10}
              fill="var(--muted)"
            >
              {ml.label}
            </text>
          ))}

          {/* Day labels */}
          {DAYS_ZH.map((label, i) =>
            label ? (
              <text
                key={`d-${i}`}
                x={0}
                y={LABEL_H + i * SIZE + CELL - 1}
                fontSize={10}
                fill="var(--muted)"
              >
                {label}
              </text>
            ) : null
          )}

          {/* Cells */}
          {grid.map((cell) => (
            <rect
              key={cell.date}
              x={LABEL_W + cell.col * SIZE}
              y={LABEL_H + cell.row * SIZE}
              width={CELL}
              height={CELL}
              rx={2}
              fill={cell.entries.length > 0 ? COLORS.filled : COLORS.empty}
              style={{ cursor: cell.entries.length > 0 ? "pointer" : "default" }}
              onClick={() => handleClick(cell.entries)}
              onMouseEnter={(e) => handleMouseEnter(e, cell.entries, cell.date)}
              onMouseLeave={() => setTooltip(null)}
            >
              <title>
                {cell.date}
                {cell.entries.length > 0
                  ? ` — ${cell.entries.map((e) => e.title).join(", ")}`
                  : ""}
              </title>
            </rect>
          ))}
        </svg>
      </div>

      {/* Floating tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-[var(--foreground)] text-[var(--background)] text-xs px-3 py-2 rounded-md shadow-lg whitespace-nowrap"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: tooltip.flipDown
              ? "translate(-50%, 0)"
              : "translate(-50%, -100%)",
            zIndex: 10,
          }}
        >
          <div className="opacity-70 text-[10px]">
            {(() => {
              const [y, m, d] = tooltip.date.split("-");
              return `${y}年${parseInt(m)}月${parseInt(d)}日`;
            })()}
          </div>
          <div className="font-medium" style={{ color: "var(--accent-inverse)" }}>
            {tooltip.entry.title}
          </div>
        </div>
      )}
    </div>
  );
}
