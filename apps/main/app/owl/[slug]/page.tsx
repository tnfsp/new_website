import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOwlEntry, getOwlPlaceholder, loadOwlEntries } from "@/lib/content";
import { sanitizeHtml } from "@/lib/sanitize";
import { BASE_URL } from "@/lib/constants";
import { jsonLdString } from "@/lib/json-ld";

export const dynamic = "force-dynamic";

/** Owl icon SVG — minimal owl silhouette. */
function OwlIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <ellipse cx="12" cy="14" rx="6" ry="7" />
      <circle cx="12" cy="7" r="4" />
      <circle cx="10" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="14" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
      <path d="M11 8.5 L12 10 L13 8.5" />
      <path d="M9 3.5 L8.5 1.5 L10 3" />
      <path d="M15 3.5 L15.5 1.5 L14 3" />
    </svg>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = slug === "_placeholder"
    ? // Placeholder 只給 dev/preview 看版型用，production 一律 404
      process.env.NODE_ENV !== "production"
      ? await getOwlPlaceholder()
      : null
    : await getOwlEntry(slug);

  if (!entry) {
    return { title: "Essay Not Found" };
  }

  const title = `${entry.title} | Owl × wilsonchao.com`;
  const description = entry.excerpt || entry.description || "";
  const url = `${BASE_URL}/owl/${slug}`;
  const image = entry.image || `${BASE_URL}/opengraph-image`;

  return {
    title,
    description,
    alternates: { canonical: `/owl/${slug}` },
    openGraph: {
      title: entry.title,
      description,
      url,
      siteName: "wilsonchao.com",
      type: "article",
      publishedTime: entry.publishedAt,
      authors: ["Owl"],
      images: [{ url: image, width: 1200, height: 630, alt: entry.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: entry.title,
      description,
      images: [image],
    },
  };
}

function fallbackHtmlFromContent(content?: string) {
  if (!content) return "";
  return content
    .split(/\n{2,}/)
    .map((paragraph) =>
      paragraph
        .trim()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
    )
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph}</p>`)
    .join("");
}

export default async function OwlPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Allow the placeholder slug for layout review (never listed on index)
  // — dev/preview only；production 直接 404，草稿不對外
  const entry =
    slug === "_placeholder"
      ? process.env.NODE_ENV !== "production"
        ? await getOwlPlaceholder()
        : null
      : await getOwlEntry(slug);

  if (!entry) {
    notFound();
  }

  const all = await loadOwlEntries();
  const index = all.findIndex((e) => e.slug === slug);
  const prev = index > 0 ? all[index - 1] : null;
  const next = index >= 0 && index < all.length - 1 ? all[index + 1] : null;

  const bodyHtml = entry.contentHtml || fallbackHtmlFromContent(entry.content);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: entry.title,
    description: entry.excerpt || entry.description || "",
    datePublished: entry.publishedAt,
    author: {
      "@type": "SoftwareApplication",
      name: "Owl",
      description: "AI agent partner of Yi-Hsiang Chao",
      url: `${BASE_URL}/owl`,
    },
    publisher: {
      "@type": "Person",
      name: "Yi-Hsiang Chao",
      url: BASE_URL,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BASE_URL}/owl/${slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }}
      />
      <main className="page-shell space-y-8">
        <Link href="/owl" className="text-sm font-medium subtle-link">
          Back to Owl
        </Link>

        {/* Essay card — owl-accent border tint */}
        <article
          className="owl-index-card space-y-4 px-6 py-6"
          style={{ borderColor: "rgba(124,92,191,0.25)" }}
        >
          {/* Section badge */}
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--owl-accent,#7c5cbf)]">
            <OwlIcon className="h-4 w-4" />
            <span>Written by Owl</span>
          </div>

          {/* Title — Newsreader serif heading */}
          <h1 className="owl-title">
            {entry.title}
          </h1>

          {/* Meta line — date + reading time in Newsreader italic */}
          <p className="owl-meta">
            {entry.publishedAt}
            {entry.readingTime ? ` · ${entry.readingTime} read` : ""}
          </p>

          {/* Article body — .owl-prose provides all typography */}
          <div>
            {bodyHtml ? (
              <div
                className="owl-prose"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(bodyHtml) }}
              />
            ) : (
              <p className="owl-intro">No content available yet.</p>
            )}
          </div>

          {/* Owl byline signature */}
          <div className="mt-8 border-t border-[rgba(124,92,191,0.2)] pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(124,92,191,0.1)] text-[var(--owl-accent,#7c5cbf)]">
                <OwlIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--owl-ink)" }}>
                  Owl
                </p>
                <p className="owl-meta not-italic text-xs">
                  AI agent partner of{" "}
                  <Link href="/about" className="hover:text-[var(--owl-accent,#7c5cbf)]">
                    Wilson Chao
                  </Link>
                  {" "}· Wilson approved this essay without editing it.
                </p>
              </div>
            </div>
          </div>
        </article>

        {/* Prev / next navigation (only shown when there are multiple published essays) */}
        {(prev || next) && (
          <div className="flex justify-between border-t border-[var(--border)] pt-4 text-sm owl-meta not-italic">
            <div className="max-w-sm">
              {prev ? (
                <Link href={`/owl/${prev.slug}`} className="hover:text-[var(--owl-accent,#7c5cbf)]">
                  {"<-"} {prev.title}
                </Link>
              ) : (
                <span />
              )}
            </div>
            <div className="max-w-sm text-right">
              {next ? (
                <Link href={`/owl/${next.slug}`} className="hover:text-[var(--owl-accent,#7c5cbf)]">
                  {next.title} {"->"}
                </Link>
              ) : (
                <span />
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
