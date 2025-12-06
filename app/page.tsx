import Link from "next/link";
import { loadBlogEntries, loadSiteCopy, loadProjects, loadMurmurEntries } from "@/lib/content";
import { ViewStats } from "@/components/ui/ViewCounter";

export default async function Home() {
  const [siteCopy, blogEntries, projects, murmur] = await Promise.all([
    loadSiteCopy(),
    loadBlogEntries(),
    loadProjects(),
    loadMurmurEntries(),
  ]);
  const latest = blogEntries.slice(0, 3);
  const latestDaily = projects.slice(0, 3);
  const formatMurmurDate = (value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("zh-TW", {
      timeZone: "Asia/Taipei",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="page-shell space-y-12">
      <header className="space-y-4">
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
        <div className="flex items-baseline justify-between gap-3">
          <span className="section-title">Latest Blog</span>
          <Link
            href="/blog"
            className="text-sm text-[var(--muted)] underline decoration-[var(--border)] underline-offset-8 transition-colors hover:text-[var(--accent)]"
          >
            查看更多 →
          </Link>
        </div>
        <div className="space-y-5">
          {latest.map((post) => (
            <article
              key={post.slug}
              className="rounded-lg border border-[var(--border)] bg-white/85 px-5 py-4"
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
                {post.readingTime ? `${post.readingTime} read` : "Read time TBD"}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block">
        <span className="section-title">murmur</span>
        <div className="rounded-lg border border-[var(--border)] bg-white/80 px-5 py-6 space-y-4">
          <p className="text-base text-[var(--muted)]">{siteCopy.murmurIntro}</p>
          {murmur.length > 0 ? (
            <div className="space-y-3">
              {murmur.map((item) => (
                // Show highlighted text; if description exists, use it instead of repeating title.
                <div
                  key={item.link || item.title}
                  className="space-y-1 rounded-md border border-[var(--border)] bg-white/95 px-4 py-3"
                >
                  <a
                    href={item.link}
                    className="block text-sm text-[var(--foreground)] hover:text-[var(--accent)]"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="inline-block rounded-[4px] bg-[#fff2b2] px-1.5 py-[2px] leading-relaxed">
                      {item.description || item.title}
                    </span>
                  </a>
                  {item.pubDate ? (
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)] text-right">
                      {formatMurmurDate(item.pubDate)}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
          <div className="pt-2">
            <Link
              href="/murmur"
              className="inline-flex items-center text-sm font-medium text-[var(--foreground)] underline decoration-[var(--border)] underline-offset-8 transition-colors hover:text-[var(--accent)]"
            >
              {murmur.length > 0 ? "更多 murmur →" : siteCopy.murmurCTA}
            </Link>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="flex items-baseline justify-between gap-3">
          <span className="section-title">Latest Daily</span>
          <Link
            href="/daily"
            className="text-sm text-[var(--muted)] underline decoration-[var(--border)] underline-offset-8 transition-colors hover:text-[var(--accent)]"
          >
            查看更多 →
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {latestDaily.map((project) => (
            <div
              key={project.title}
              className="rounded-lg border border-[var(--border)] bg-white/85 px-5 py-4"
            >
              <h3 className="text-lg font-semibold text-[var(--foreground)]">
                {project.slug
                  ? (
                    <Link href={`/daily/${project.slug}`} className="hover:text-[var(--accent)]">
                      {project.title}
                    </Link>
                    )
                  : project.href && (project.href.startsWith("/") || project.href.startsWith("http"))
                    ? (
                      <Link href={project.href} className="hover:text-[var(--accent)]">
                        {project.title}
                      </Link>
                      )
                    : project.title}
              </h3>
              <p className="text-sm text-[var(--muted)]">{project.description}</p>
              {project.date ? (
                <p className="pt-1 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                  {project.date}
                </p>
              ) : null}
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
        <div className="pt-3">
          <ViewStats slug="home" />
        </div>
      </footer>
    </main>
  );
}
