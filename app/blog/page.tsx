import Link from "next/link";
import { loadBlogEntries, loadSiteCopy } from "@/lib/content";

type SearchParams = {
  type?: string;
};

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const posts = await loadBlogEntries();
  const copy = await loadSiteCopy();
  const resolvedSearch = await searchParams;
  const typeParam = resolvedSearch?.type;
  const availableTypes = Array.from(new Set(posts.map((p) => p.type).filter(Boolean))).sort();
  const filtered =
    typeParam && availableTypes.includes(typeParam)
      ? posts.filter((post) => post.type === typeParam)
      : posts;

  return (
    <main className="page-shell space-y-8">
      <header className="space-y-3">
        <span className="section-title">Blog</span>
        <h1 className="text-3xl font-semibold text-[var(--foreground)]">{copy.blogTitle}</h1>
        <p className="max-w-2xl text-base text-[var(--muted)]">{copy.blogIntro}</p>
      </header>

      {availableTypes.length > 0 ? (
        <div className="flex flex-wrap gap-2 text-sm text-[var(--muted)]">
          <Link
            href="/blog"
            className={`rounded-full border px-3 py-1 transition-colors ${
              !typeParam
                ? "border-[var(--foreground)] text-[var(--foreground)]"
                : "border-[var(--border)] hover:text-[var(--accent)]"
            }`}
          >
            All
          </Link>
          {availableTypes.map((type) => (
            <Link
              key={type}
              href={`/blog?type=${encodeURIComponent(type ?? "")}`}
              className={`rounded-full border px-3 py-1 transition-colors ${
                typeParam === type
                  ? "border-[var(--foreground)] text-[var(--foreground)]"
                  : "border-[var(--border)] hover:text-[var(--accent)]"
              }`}
            >
              {type}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="space-y-5">
        {filtered.map((post) => (
          <article
            key={post.slug}
            className="rounded-lg border border-[var(--border)] bg-white/85 px-5 py-4"
          >
            <div className="flex items-center justify-between text-sm text-[var(--muted)]">
              <span>{post.type}</span>
              <span>{post.publishedAt}</span>
            </div>
            <h2 className="pt-1 text-2xl font-semibold text-[var(--foreground)]">
              <Link href={`/blog/${post.slug}`} className="hover:text-[var(--accent)]">
                {post.title}
              </Link>
            </h2>
            {post.type ? (
              <div className="flex flex-wrap gap-2 pt-1 text-xs text-[var(--muted)]">
                <span className="rounded-full border border-[var(--border)] px-2 py-1">
                  {post.type}
                </span>
              </div>
            ) : null}
            <p className="text-[var(--muted)] leading-relaxed">{post.excerpt}</p>
            <div className="pt-2 text-sm text-[var(--muted)]">
              {post.readingTime ? `${post.readingTime} read` : "Read time TBD"}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
