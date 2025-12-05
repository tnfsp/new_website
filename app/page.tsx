import Link from "next/link";
import { loadBlogEntries, loadSiteCopy, loadProjects } from "@/lib/content";

export default async function Home() {
  const [siteCopy, blogEntries, projects] = await Promise.all([
    loadSiteCopy(),
    loadBlogEntries(),
    loadProjects(),
  ]);
  const latest = blogEntries.slice(0, 3);

  return (
    <main className="page-shell space-y-12">
      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
          Yi-Hsiang Chao, MD
        </p>
        <h1 className="text-3xl font-semibold leading-tight text-[var(--foreground)] sm:text-4xl">
          {siteCopy.heroTitle}
        </h1>
        <p className="text-lg text-[var(--muted)]">{siteCopy.heroSubtitle}</p>
        <p className="max-w-3xl text-base text-[var(--muted)]">{siteCopy.heroIntro}</p>
        <div className="pt-2">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground)] underline decoration-[var(--accent)] decoration-2 underline-offset-8 transition-colors hover:text-[var(--accent)]"
          >
            {siteCopy.heroCTA}
          </Link>
        </div>
      </header>

      <section className="section-block">
        <span className="section-title">Latest blog</span>
        <div className="space-y-5">
          {latest.map((post) => (
            <article
              key={post.slug}
              className="rounded-2xl border border-[var(--border)] bg-white/80 px-5 py-4 shadow-[0_8px_26px_rgba(0,0,0,0.03)]"
            >
              <div className="flex items-center justify-between text-sm text-[var(--muted)]">
                <span>{post.type}</span>
                <span>{post.publishedAt}</span>
              </div>
              <h3 className="pt-1 text-xl font-semibold text-[var(--foreground)]">
                <Link href={`/blog/${post.slug}`} className="hover:text-[var(--accent)]">
                  {post.title}
                </Link>
              </h3>
              <p className="text-[var(--muted)] leading-relaxed">{post.excerpt}</p>
              <div className="pt-2 text-sm text-[var(--muted)]">
                {post.readingTime ? `${post.readingTime} read` : "—"}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block">
        <span className="section-title">murmur</span>
        <div className="rounded-xl border border-[var(--border)] bg-white/70 px-5 py-6 shadow-[0_4px_30px_rgba(0,0,0,0.02)]">
          <p className="text-base text-[var(--muted)]">
            Daily fragments and half sentences live in murmur. It is a lighter, quicker feed.
          </p>
          <div className="pt-4">
            <Link
              href="/murmur"
              className="inline-flex items-center text-sm font-medium text-[var(--foreground)] underline decoration-[var(--border)] underline-offset-8 transition-colors hover:text-[var(--accent)]"
            >
              Visit murmur →
            </Link>
          </div>
        </div>
      </section>

      <section className="section-block">
        <span className="section-title">Featured projects</span>
        <div className="grid gap-5 sm:grid-cols-2">
          {projects.map((project) => (
            <div
              key={project.title}
              className="rounded-2xl border border-[var(--border)] bg-white/80 px-5 py-4 shadow-[0_6px_22px_rgba(0,0,0,0.02)]"
            >
              <h3 className="text-lg font-semibold text-[var(--foreground)]">
                <Link href={project.href} className="hover:text-[var(--accent)]">
                  {project.title}
                </Link>
              </h3>
              <p className="text-sm text-[var(--muted)]">{project.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-block">
        <span className="section-title">About</span>
        <div className="space-y-3">
          <p className="text-base text-[var(--muted)] leading-relaxed">{siteCopy.aboutIntro}</p>
          <Link
            href="/about"
            className="text-sm font-medium text-[var(--foreground)] underline decoration-[var(--border)] underline-offset-8 transition-colors hover:text-[var(--accent)]"
          >
            Read the full story →
          </Link>
        </div>
      </section>

      <footer className="pt-6 text-sm text-[var(--muted)]">
        {siteCopy.footerText}
      </footer>
    </main>
  );
}
