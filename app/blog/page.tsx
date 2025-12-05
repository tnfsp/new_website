import Link from "next/link";
import { loadBlogEntries } from "@/lib/content";

export default async function BlogIndexPage() {
  const posts = await loadBlogEntries();

  return (
    <main className="page-shell space-y-10">
      <header className="space-y-3">
        <span className="section-title">Blog</span>
        <h1 className="text-3xl font-semibold text-[var(--foreground)]">Articles & notes</h1>
        <p className="max-w-2xl text-base text-[var(--muted)]">
          Long-form writing on medicine, stories from the ward, and how to keep a craft humane.
        </p>
      </header>

      <div className="space-y-5">
        {posts.map((post) => (
          <article
            key={post.slug}
            className="rounded-2xl border border-[var(--border)] bg-white/85 px-5 py-4 shadow-[0_8px_26px_rgba(0,0,0,0.03)]"
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
            <p className="text-[var(--muted)] leading-relaxed">{post.excerpt}</p>
            <div className="pt-2 text-sm text-[var(--muted)]">
              {post.readingTime ? `${post.readingTime} read` : "—"}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
