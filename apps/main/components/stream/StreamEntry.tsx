"use client";

import { useMemo } from "react";
import DOMPurify from "isomorphic-dompurify";

type Props = {
  title: string;
  link: string;
  contentHtml?: string;
  description?: string;
  pubDate?: string;
  tags?: string[];
};

function extractYouTubeId(html: string): string | null {
  const match = html.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  return match?.[1] ?? null;
}

function extractLinkPreview(html: string): {
  href: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
} | null {
  // Match TG link preview blocks
  const previewMatch = html.match(
    /<a[^>]*class="[^"]*tgme_widget_message_link_preview[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i
  );
  if (!previewMatch) return null;

  const href = previewMatch[1];
  // href 會直接進 <a href>，只允許 http(s)（擋 javascript: 之類的 scheme）
  if (!/^https?:\/\//i.test(href)) return null;
  const inner = previewMatch[2];

  const titleMatch = inner.match(
    /class="[^"]*link_preview_title[^"]*"[^>]*>([\s\S]*?)<\//i
  );
  const descMatch = inner.match(
    /class="[^"]*link_preview_description[^"]*"[^>]*>([\s\S]*?)<\//i
  );
  const siteMatch = inner.match(
    /class="[^"]*link_preview_site_name[^"]*"[^>]*>([\s\S]*?)<\//i
  );
  const imgMatch = inner.match(
    /style="[^"]*background-image:\s*url\('(https?:\/\/[^']+)'\)/i
  ) || inner.match(/<img[^>]*src="(https?:\/\/[^"]+)"/i);

  return {
    href,
    title: titleMatch?.[1]?.replace(/<[^>]+>/g, "").trim(),
    description: descMatch?.[1]?.replace(/<[^>]+>/g, "").trim(),
    image: imgMatch?.[1],
    siteName: siteMatch?.[1]?.replace(/<[^>]+>/g, "").trim(),
  };
}

function cleanHtml(html: string): string {
  let cleaned = html;
  // Remove TG link preview blocks
  cleaned = cleaned.replace(
    /<a[^>]*class="[^"]*tgme_widget_message_link_preview[^"]*"[^>]*>[\s\S]*?<\/a>/gim,
    ""
  );
  // Remove video/figure tags
  cleaned = cleaned.replace(/<video[\s\S]*?<\/video>/gim, "");
  cleaned = cleaned.replace(/<figure[^>]*>[\s\S]*?<\/figure>/gim, "");
  // Remove hashtag links (#murmur, #blog etc) but keep text before them
  cleaned = cleaned.replace(
    /<a[^>]*href="\/search\/%23[^"]*"[^>]*>#\w+<\/a>/gim,
    ""
  );
  // Clean up trailing <br> tags
  cleaned = cleaned.replace(/(<br\s*\/?>[\s]*)+$/gim, "");
  // Sanitize with DOMPurify
  cleaned = DOMPurify.sanitize(cleaned, {
    ALLOWED_TAGS: ["a", "b", "i", "em", "strong", "br", "p", "span"],
    ALLOWED_ATTR: ["href", "class", "target", "rel"],
  });
  // Make external links open in new tab（不管屬性順序，沒有 target 的 <a> 都補上）
  cleaned = cleaned.replace(
    /<a\b(?![^>]*\btarget=)([^>]*)>/gi,
    '<a target="_blank" rel="noopener noreferrer"$1>'
  );
  return cleaned.trim();
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  const sameYear = date.getFullYear() === now.getFullYear();
  if (sameYear) {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "Asia/Taipei",
    });
  }
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Taipei",
  });
}

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
  });
}

export function StreamEntry({ title, contentHtml, description, pubDate, tags }: Props) {
  const isBlog = tags?.includes("blog");

  const youtubeId = useMemo(() => {
    if (!contentHtml) return null;
    return extractYouTubeId(contentHtml);
  }, [contentHtml]);

  const linkPreview = useMemo(() => {
    if (!contentHtml || youtubeId) return null;
    return extractLinkPreview(contentHtml);
  }, [contentHtml, youtubeId]);

  const cleanedHtml = useMemo(() => {
    if (!contentHtml) return "";
    return cleanHtml(contentHtml);
  }, [contentHtml]);

  const blogSlug = useMemo(() => {
    if (!isBlog || !contentHtml) return null;
    const match = contentHtml.match(/href="https?:\/\/wilsonchao\.com\/(blog|daily|journal)\/([^"]+)"/);
    return match ? `/${match[1]}/${match[2]}` : null;
  }, [isBlog, contentHtml]);

  return (
    <div
      className={`rounded-md border bg-[var(--surface-strong)] px-4 py-3 space-y-2 ${
        isBlog
          ? "border-l-[3px] border-l-[var(--accent-strong)] border-[var(--border)]"
          : "border-[var(--border)]"
      }`}
    >
      {/* Main content */}
      {cleanedHtml ? (
        <div
          className="text-sm text-[var(--foreground)] leading-relaxed break-words [&_a]:text-[var(--accent)] [&_a]:underline [&_a]:underline-offset-4 [&_b]:font-semibold [&_i.emoji]:not-italic"
          dangerouslySetInnerHTML={{ __html: cleanedHtml }}
        />
      ) : (
        <p className="text-sm text-[var(--foreground)] leading-relaxed break-words">
          {description || title}
        </p>
      )}

      {/* YouTube embed */}
      {youtubeId ? (
        <div className="overflow-hidden rounded-md border border-[var(--border)]">
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      ) : null}

      {/* Link preview card */}
      {linkPreview ? (
        <a
          href={linkPreview.href}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-md border border-[var(--border)] overflow-hidden hover:border-[var(--accent)] transition-colors"
        >
          {linkPreview.image ? (
            <img
              src={linkPreview.image}
              alt={linkPreview.title || ""}
              className="h-32 w-full object-cover"
              loading="lazy"
            />
          ) : null}
          <div className="px-3 py-2 space-y-0.5">
            {linkPreview.siteName ? (
              <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
                {linkPreview.siteName}
              </p>
            ) : null}
            {linkPreview.title ? (
              <p className="text-sm font-medium text-[var(--foreground)] line-clamp-2">
                {linkPreview.title}
              </p>
            ) : null}
            {linkPreview.description ? (
              <p className="text-xs text-[var(--muted)] line-clamp-2">
                {linkPreview.description}
              </p>
            ) : null}
          </div>
        </a>
      ) : null}

      {/* Blog CTA */}
      {isBlog && blogSlug ? (
        <a
          href={blogSlug}
          className="inline-flex items-center text-xs font-medium text-[var(--accent-strong)] hover:underline underline-offset-4"
        >
          閱讀全文 →
        </a>
      ) : null}

      {/* Timestamp：相對時間依 client 的「現在」計算，server/client 會差一點 */}
      {pubDate ? (
        <time
          suppressHydrationWarning
          dateTime={pubDate}
          className="block text-xs tracking-[0.18em] text-[var(--muted)] text-right"
          title={formatFullDate(pubDate)}
        >
          {formatRelativeTime(pubDate)}
        </time>
      ) : null}
    </div>
  );
}
