import type { Metadata } from "next";
import Link from "next/link";
import { loadNowData, isStale } from "@/lib/now";
import { jsonLdString } from "@/lib/json-ld";
import { NowDynamicGrid } from "@/components/now/NowDynamicGrid";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://wilsonchao.com";

export const revalidate = 3600; // ISR: hourly

export const metadata: Metadata = {
  title: "Now — Wilson Chao",
  description: "趙玴祥現在在忙什麼——臨床、研究、寫作、造東西。",
  alternates: { canonical: `${BASE_URL}/now` },
  openGraph: {
    title: "Now — Wilson Chao",
    description: "趙玴祥現在在忙什麼——臨床、研究、寫作、造東西。",
    url: `${BASE_URL}/now`,
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
};

/* Fallback when now.json fails */
const FALLBACK_SECTIONS = [
  { id: "clinical", emoji: "🏥", title: "臨床", body: "在高醫心臟血管外科當總醫師，八月升主治。" },
  { id: "research", emoji: "📚", title: "研究", body: "NMA + Case Report 進行中。" },
  { id: "writing", emoji: "✍️", title: "寫作", body: "短文、碎片、長文。" },
  { id: "building", emoji: "🤖", title: "在蓋的東西", body: "AI-assisted 個人系統。" },
  { id: "other", emoji: "🎵", title: "其他", body: "DJ、健身、走路。" },
];

/** Parse markdown-style [text](url) into React nodes */
function renderLinkedText(text: string) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (match) {
      return (
        <a
          key={i}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-link"
        >
          {match[1]}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function formatLastUpdated(iso: string): string {
  // new Date(壞字串) 不會 throw，只會回 Invalid Date——
  // 不 guard 的話頁面會直接顯示 "Invalid Date"
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" });
}

export default async function NowPage() {
  const data = await loadNowData();
  const opening = data?.opening?.trim() ? data.opening.split(/\n\n+/) : [];
  const list = data?.list?.length ? data.list : [];
  const blocks = data?.sections?.length ? data.sections : [];
  const usesNewShape = opening.length > 0 || list.length > 0 || blocks.length > 0;
  const sections = usesNewShape ? [] : FALLBACK_SECTIONS;
  const lastUpdated = data?.lastUpdated || "";
  const stale = lastUpdated ? isStale(lastUpdated) : false;
  const hasDynamic = data?.dynamic && Object.values(data.dynamic).some((a) => a.length > 0);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Now", item: `${BASE_URL}/now` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbJsonLd) }}
      />
      <main className="page-shell space-y-6">
        {/* Header */}
        <header className="space-y-2">
          <span className="section-title">Now</span>
          <h1 className="text-3xl font-semibold text-[var(--foreground)]">
            What I&apos;m focusing on
          </h1>
          {data?.subtitle && (
            <p className="text-sm text-[var(--muted)]">{data.subtitle}</p>
          )}
          {lastUpdated && (
            <p className="text-sm text-[var(--muted)]">
              最後更新：<time dateTime={lastUpdated}>{formatLastUpdated(lastUpdated)}</time>
              {stale && (
                <span className="ml-2 text-xs text-[var(--muted)]/50">· 可能不是最新的</span>
              )}
            </p>
          )}
        </header>

        {usesNewShape ? (
          <>
            {/* Opening confession — the voice of the page */}
            {opening.length > 0 && (
              <div className="space-y-4">
                {opening.map((para, i) => (
                  <p key={i} className="leading-relaxed text-[var(--foreground)]">
                    {renderLinkedText(para)}
                  </p>
                ))}
              </div>
            )}

            {/* Themed blocks — card grid (nownownow / Sivers style) */}
            {blocks.length > 0 && (
              <div className="grid gap-4">
                {blocks.map((s) => (
                  <section key={s.id} className="surface-card px-6 py-5 space-y-2">
                    <h2 className="text-lg font-semibold text-[var(--foreground)]">
                      {s.emoji ? `${s.emoji} ` : ""}
                      {s.title}
                    </h2>
                    <div className="space-y-3">
                      {s.body.split(/\n\n+/).map((para, i) => (
                        <p key={i} className="leading-relaxed text-[var(--foreground)]">
                          {renderLinkedText(para)}
                        </p>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}

            {/* Optional loose list (kept for flexibility) */}
            {list.length > 0 && (
              <ul className="space-y-2.5">
                {list.map((item, i) => (
                  <li
                    key={i}
                    className="relative pl-5 leading-relaxed text-[var(--foreground)]"
                  >
                    <span
                      aria-hidden
                      className="absolute left-0 top-[0.7em] h-1.5 w-1.5 rounded-full bg-[var(--accent-strong)]"
                    />
                    {renderLinkedText(item)}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            {/* Legacy: intro + titled sections */}
            {data?.intro && (
              <p className="leading-relaxed text-[var(--muted)]">{renderLinkedText(data.intro)}</p>
            )}
            <div className="grid gap-4">
              {sections.map((s) => (
                <section key={s.id} className="surface-card px-6 py-5 space-y-2">
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">
                    {s.emoji} {s.title}
                  </h2>
                  <div className="space-y-3">
                    {s.body.split(/\n\n+/).map((para, i) => (
                      <p key={i} className="leading-relaxed text-[var(--foreground)]">
                        {renderLinkedText(para)}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}

        {/* Dynamic sections */}
        {hasDynamic && data?.dynamic && (
          <>
            <hr className="border-[var(--border)]" />
            <NowDynamicGrid dynamic={data.dynamic} />
          </>
        )}

        {/* Stream CTA when no dynamic */}
        {!hasDynamic && (
          <p className="text-sm text-[var(--muted)]">
            更多碎片在{" "}
            <Link href="/stream" className="inline-link">
              Stream →
            </Link>
          </p>
        )}

        {/* Footer */}
        <footer className="space-y-3 border-t border-[var(--border)] pt-6">
          <p className="text-[var(--muted)]">
            想聊這些？{" "}
            <a
              href="mailto:hi@wilsonchao.com"
              className="inline-link"
            >
              寫信給我
            </a>{" "}
            或{" "}
            <a
              href="https://instagram.com/momobear_doctor"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-link"
            >
              IG @momobear_doctor
            </a>
          </p>
          <p className="text-xs text-[var(--muted)]/60">
            {data?.footer ? `${data.footer} ` : ""}Inspired by{" "}
            <a
              href="https://nownownow.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-link"
            >
              nownownow.com
            </a>
          </p>
        </footer>
      </main>
    </>
  );
}
