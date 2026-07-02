import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogEntry, loadBlogEntries } from "@/lib/content";
import { ViewCounter } from "@/components/ui/ViewCounter";
import { LikeButton } from "@/components/ui/LikeButton";
import { CodeHighlight } from "@/components/ui/CodeHighlight";
import { sanitizeHtml } from "@/lib/sanitize";
import { SubscribeForm } from "@/components/ui/SubscribeForm";
import { AuthorSignature } from "@/components/ui/AuthorSignature";
import { CommentSection } from "@/components/ui/CommentSection";
import { BASE_URL } from "@/lib/constants";
import { jsonLdString } from "@/lib/json-ld";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getBlogEntry(slug);

  if (!entry) {
    return { title: "Post Not Found" };
  }

  const title = `${entry.title} | wilsonchao.com`;
  const description = entry.excerpt || entry.description || "";
  const url = `${BASE_URL}/blog/${slug}`;
  // Per-post OG card (next/og dynamic route). A custom `image` still wins if set;
  // otherwise the per-post card beats the generic site-wide /opengraph-image.
  const image = entry.image || `${BASE_URL}/blog/${slug}/opengraph-image`;

  return {
    title,
    description,
    alternates: {
      canonical: `/blog/${slug}`,
    },
    openGraph: {
      title: entry.title,
      description,
      url,
      siteName: "wilsonchao.com",
      type: "article",
      publishedTime: entry.publishedAt,
      authors: ["趙玴祥"],
      // entry.image 是任意（多半直式）封面照，寫死 1200x630 會讓爬蟲裁錯圖；
      // 只有自產的 opengraph-image 才標尺寸
      images: entry.image
        ? [{ url: image, alt: entry.title }]
        : [{ url: image, width: 1200, height: 630, alt: entry.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: entry.title,
      description,
      images: [image],
    },
  };
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function fallbackHtmlFromContent(content?: string) {
  if (!content) return "";
  return content
    .split(/\n{2,}/)
    .map((paragraph) => escapeHtml(paragraph.trim()))
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph}</p>`)
    .join("");
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = await getBlogEntry(slug);

  if (!entry) {
    notFound();
  }

  const all = await loadBlogEntries();
  const index = all.findIndex((post) => post.slug === slug);
  const prev = index > 0 ? all[index - 1] : null;
  const next = index >= 0 && index < all.length - 1 ? all[index + 1] : null;

  const bodyHtml = entry.contentHtml || fallbackHtmlFromContent(entry.content);
  const firstBodyImageSrc = bodyHtml
    ? bodyHtml.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1]
    : undefined;
  const heroImage = entry.image && entry.image !== firstBodyImageSrc ? entry.image : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: entry.title,
    description: entry.excerpt || entry.description || "",
    // JSON-LD 的 image 要絕對 URL（entry.image 是 /content/... 相對路徑，
    // Google Article rich result 不收相對路徑）
    image: entry.image ? new URL(entry.image, BASE_URL).href : `${BASE_URL}/avatar.png`,
    datePublished: entry.publishedAt,
    author: {
      "@type": "Person",
      name: "Yi-Hsiang Chao",
      url: `${BASE_URL}/about`,
    },
    publisher: {
      "@type": "Person",
      name: "Yi-Hsiang Chao",
      url: BASE_URL,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BASE_URL}/blog/${slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }}
      />
    <main className="page-shell space-y-8">
      <Link
        href="/blog"
        className="text-sm font-medium subtle-link"
      >
        Back to blog
      </Link>
      <article className="surface-card space-y-4 px-6 py-5">
        <header className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent-strong)]">
            {entry.type}
          </p>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-[var(--foreground)]">
            {entry.title}
          </h1>
          <p className="text-sm text-[var(--muted)]">
            {entry.publishedAt}
            {entry.readingTime ? ` · ${entry.readingTime}` : ""}
          </p>
        </header>
        <ViewCounter slug={entry.slug} />
        {heroImage ? (
          <div className="overflow-hidden rounded-lg border border-[var(--border)]">
            <Image
              src={heroImage}
              alt={entry.title}
              width={1024}
              height={1024}
              className="w-full h-auto"
              sizes="100vw"
              unoptimized
              priority={false}
            />
          </div>
        ) : null}
        {/* excerpt hidden — already in body content */}
        <div className="space-y-3 text-[var(--foreground)] leading-relaxed">
          {bodyHtml ? (
            <>
              <CodeHighlight />
              <div
                className="prose prose-blog max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(bodyHtml) }}
              />
            </>
          ) : (
            <p>No content available yet. Check back soon.</p>
          )}
        </div>
        <div className="pt-4">
          <LikeButton slug={`blog:${entry.slug}`} />
        </div>
        <div className="mt-6">
          <AuthorSignature />
        </div>
        <div className="mt-6 border-t border-[var(--border)] pt-6">
          <p className="mb-3 text-sm text-[var(--muted)]">
            訂閱週報——每週一封，偶爾是寫給老朋友的信：
          </p>
          <SubscribeForm source={`blog:${entry.slug}`} />
        </div>
        <details className="mt-6 border-t border-[var(--border)] pt-6 group">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-lg font-semibold text-[var(--foreground)] [&::-webkit-details-marker]:hidden">
            <svg
              className="h-4 w-4 text-[var(--muted)] transition-transform duration-200 group-open:rotate-90"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            留言
          </summary>
          <CommentSection slug={entry.slug} />
        </details>
        {(() => {
          const relatedSlugs = entry.related || [];
          const relatedPosts = relatedSlugs
            .map((s: string) => all.find((p) => p.slug === s))
            .filter(Boolean);
          if (relatedPosts.length === 0) return null;
          return (
            <div className="mt-8 border-t border-[var(--border)] pt-6">
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">延伸閱讀</h3>
              <div className="space-y-3">
                {relatedPosts.map((post) => (
                  <Link
                    key={post!.slug}
                    href={`/blog/${post!.slug}`}
                    className="block rounded-lg border border-[var(--border)] px-4 py-3 hover:border-[var(--accent)] transition-colors"
                  >
                    <p className="text-sm font-medium text-[var(--accent)]">{post!.title}</p>
                    {post!.excerpt && (
                      <p className="text-xs text-[var(--muted)] mt-1 line-clamp-1">{post!.excerpt}</p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          );
        })()}
      </article>
      {(prev || next) && (
        <div className="flex justify-between border-t border-[var(--border)] pt-4 text-sm text-[var(--muted)]">
          <div className="max-w-sm">
            {prev ? (
              <Link href={`/blog/${prev.slug}`} className="hover:text-[var(--accent)]">
                {"<-"} {prev.title}
              </Link>
            ) : (
              <span />
            )}
          </div>
          <div className="max-w-sm text-right">
            {next ? (
              <Link href={`/blog/${next.slug}`} className="hover:text-[var(--accent)]">
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
