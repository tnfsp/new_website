import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogEntry, loadBlogEntries } from "@/lib/content";
import { ViewCounter } from "@/components/ui/ViewCounter";

export const dynamic = "force-dynamic";

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

  return (
    <main className="page-shell space-y-8">
      <Link
        href="/blog"
        className="text-sm font-medium text-[var(--foreground)] underline decoration-[var(--border)] underline-offset-8 hover:text-[var(--accent)]"
      >
        Back to blog
      </Link>
      <article className="space-y-4">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">{entry.type}</p>
        <h1 className="text-3xl font-semibold leading-tight text-[var(--foreground)]">
          {entry.title}
        </h1>
        <p className="text-sm text-[var(--muted)]">
          {entry.publishedAt}
          {entry.readingTime ? ` · ${entry.readingTime}` : ""}
        </p>
        <ViewCounter slug={entry.slug} />
        {entry.image ? (
          <div className="overflow-hidden rounded-lg border border-[var(--border)]">
            <Image
              src={entry.image}
              alt={entry.title}
              width={1200}
              height={630}
              className="w-full object-cover"
              sizes="100vw"
              unoptimized
              priority={false}
            />
          </div>
        ) : null}
        {entry.excerpt ? (
          <p className="text-base text-[var(--muted)] leading-relaxed">{entry.excerpt}</p>
        ) : null}
        <div className="space-y-3 text-[var(--foreground)] leading-relaxed">
          {bodyHtml ? (
            <div
              className="[&_p]:my-3 [&_p]:leading-relaxed [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-[var(--foreground)] [&_h2]:text-xl [&_h3]:text-lg [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--border)] [&_blockquote]:pl-3 [&_blockquote]:italic"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          ) : (
            <p>No content available yet. Check back soon.</p>
          )}
        </div>
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
  );
}
