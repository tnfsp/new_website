import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getBlogEntry } from "@/lib/content";
import { resolveOgMeta } from "@/lib/og-meta";

export const alt = "wilsonchao.com — blog post";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Per-post Open Graph card for wilsonchao.com blog posts.
 *
 * Adopts the og-img-gen *logic* (borrowed, not the tool): a layered metadata
 * fallback chain (see lib/og-meta.ts) feeds an @vercel/og / satori render.
 *
 * Fonts: the site-wide OG uses pre-subset TTFs, but a per-post title is
 * arbitrary CJK, so we subset Noto Sans TC dynamically via the Google Fonts
 * `text=` API (only the glyphs this post needs). If that fetch fails we fall
 * back to the bundled 700 subset so the render never crashes.
 */
async function fetchFont(chars: string, weight: 700 | 500): Promise<ArrayBuffer | Buffer> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@${weight}&text=${encodeURIComponent(
      chars
    )}`;
    const css = await (
      await fetch(cssUrl, {
        // A modern UA makes Google serve woff2->ttf; we want the ttf url
        headers: { "User-Agent": "Mozilla/5.0 (compatible; og-image-bot)" },
      })
    ).text();
    const fontUrl = css.match(/src:\s*url\((https:\/\/[^)]+)\)/)?.[1];
    if (!fontUrl) throw new Error("no font url in css");
    // Satori 不支援 woff2 — 如果 Google 哪天改回應 woff2，走 fallback 而非 500
    if (/\.woff2(\?|$)/i.test(fontUrl)) throw new Error("google served woff2");
    return await (await fetch(fontUrl)).arrayBuffer();
  } catch {
    // Bundled subset only covers brand chars — degraded but never fatal.
    const file = weight === 700 ? "noto-sans-tc-700-subset.ttf" : "noto-sans-tc-500-subset.ttf";
    return readFile(join(process.cwd(), "assets", file));
  }
}

// 模組層級快取：同一組字元＋字重只 fetch Google Fonts 一次，
// 不然每次有人分享連結、爬蟲打這個 route 都會打兩次外部請求。
// 快取的是 promise，並發請求也只會觸發一次 fetch。
const fontCache = new Map<string, Promise<ArrayBuffer | Buffer>>();
const FONT_CACHE_MAX = 128;

function loadFont(text: string, weight: 700 | 500): Promise<ArrayBuffer | Buffer> {
  const chars = Array.from(new Set(text.split(""))).sort().join("");
  const key = `${weight}:${chars}`;
  const cached = fontCache.get(key);
  if (cached) return cached;
  // 粗略的上限：長壽 process 不會無限成長
  if (fontCache.size >= FONT_CACHE_MAX) fontCache.clear();
  const promise = fetchFont(chars, weight);
  fontCache.set(key, promise);
  return promise;
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = await getBlogEntry(slug);

  const title = entry?.title || "wilsonchao.com";
  const subtitle = resolveOgMeta(entry);
  const kicker = (entry?.type || "essay").toUpperCase();
  const dateline = [entry?.publishedAt, entry?.readingTime].filter(Boolean).join(" · ");

  const [fontBold, fontMedium] = await Promise.all([
    loadFont(title, 700),
    loadFont(subtitle + kicker + dateline + "wilsonchao.com", 500),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          backgroundColor: "#f8f4ea",
          fontFamily: "Noto Sans TC",
          position: "relative",
        }}
      >
        {/* top accent strip — matches the site-wide OG */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 10,
            display: "flex",
            backgroundColor: "#0a9396",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -120,
            bottom: -120,
            width: 360,
            height: 360,
            display: "flex",
            borderRadius: 360,
            border: "3px solid #ca6702",
            opacity: 0.22,
          }}
        />

        {/* kicker: post type */}
        <div
          style={{
            display: "flex",
            fontSize: 26,
            fontWeight: 500,
            letterSpacing: 6,
            color: "#ca6702",
            marginBottom: 20,
          }}
        >
          {kicker}
        </div>

        {/* title (clamped to keep the card readable) */}
        <div
          style={{
            display: "flex",
            fontSize: title.length > 22 ? 60 : 76,
            fontWeight: 700,
            color: "#001219",
            lineHeight: 1.18,
          }}
        >
          {title.length > 48 ? title.slice(0, 47) + "…" : title}
        </div>

        {/* subtitle: resolved via the fallback chain */}
        {subtitle ? (
          <div
            style={{
              display: "flex",
              fontSize: 32,
              fontWeight: 500,
              color: "#0a9396",
              marginTop: 28,
              lineHeight: 1.4,
            }}
          >
            {subtitle.length > 70 ? subtitle.slice(0, 69) + "…" : subtitle}
          </div>
        ) : null}

        {/* footer: dateline + domain */}
        <div
          style={{
            position: "absolute",
            left: 96,
            right: 96,
            bottom: 56,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 26,
            fontWeight: 500,
            color: "#5f5043",
          }}
        >
          <div style={{ display: "flex" }}>{dateline}</div>
          <div style={{ display: "flex", color: "#ca6702" }}>wilsonchao.com</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Noto Sans TC", data: fontBold, weight: 700, style: "normal" },
        { name: "Noto Sans TC", data: fontMedium, weight: 500, style: "normal" },
      ],
    }
  );
}
