import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogEntry, loadBlogEntries } from "@/lib/content";
import { ViewCounter } from "@/components/ui/ViewCounter";
import { LikeButton } from "@/components/ui/LikeButton";
import { CodeHighlight } from "@/components/ui/CodeHighlight";

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
  const firstBodyImageSrc = bodyHtml
    ? bodyHtml.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1]
    : undefined;
  const heroImage = entry.image && entry.image !== firstBodyImageSrc ? entry.image : undefined;

  return (
    <main className="page-shell space-y-8">
      <Link
        href="/blog"
        className="text-sm font-medium text-[var(--foreground)] underline decoration-[var(--border)] underline-offset-8 hover:text-[var(--accent)]"
      >
        Back to blog
      </Link>
      <article className="surface-card space-y-4 px-6 py-5">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">{entry.type}</p>
        <h1 className="text-3xl font-semibold leading-tight text-[var(--foreground)]">
          {entry.title}
        </h1>
        <p className="text-sm text-[var(--muted)]">
          {entry.publishedAt}
          {entry.readingTime ? ` · ${entry.readingTime}` : ""}
        </p>
        <ViewCounter slug={entry.slug} />
        {heroImage ? (
          <div className="overflow-hidden rounded-lg border border-[var(--border)]">
            <Image
              src={heroImage}
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
            <>
              <CodeHighlight />
              <div
                className="[&_p]:my-3 [&_p]:leading-relaxed [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-[var(--foreground)] [&_h1]:inline-block [&_h1]:bg-[var(--highlight)] [&_h1]:px-2 [&_h1]:py-0.5 [&_h1]:rounded [&_h2]:text-xl [&_h2]:inline-block [&_h2]:bg-[var(--highlight)] [&_h2]:px-2 [&_h2]:py-0.5 [&_h2]:rounded [&_h3]:text-lg [&_h3]:inline-block [&_h3]:bg-[var(--highlight)] [&_h3]:px-2 [&_h3]:py-0.5 [&_h3]:rounded [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--border)] [&_blockquote]:pl-3 [&_blockquote]:italic [&_pre]:my-4 [&_pre]:p-4 [&_pre]:bg-[#1e1e1e] [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-[var(--border)] [&_pre_code]:text-sm [&_pre_code]:font-mono [&_pre_code]:leading-relaxed [&_code]:font-mono [&_code]:text-sm [&_code]:bg-[var(--highlight)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_pre_code]:bg-transparent [&_pre_code]:p-0"
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />
            </>
          ) : (
            <p>No content available yet. Check back soon.</p>
          )}
        </div>
        <div className="pt-4">
          <LikeButton slug={`blog:${entry.slug}`} />
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
