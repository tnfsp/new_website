import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { loadBlogEntries, loadSiteCopy } from "@/lib/content";

export const metadata: Metadata = {
  title: "Blog — Wilson Chao",
  description: "長文：醫學、故事、思考。Essay、Weekly 週報、Diary 都在這裡。",
  alternates: { canonical: "https://wilsonchao.com/blog" },
  openGraph: {
    title: "Blog — Wilson Chao",
    description: "長文：醫學、故事、思考。Essay、Weekly 週報、Diary 都在這裡。",
    url: "https://wilsonchao.com/blog",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
};

type SearchParams = {
  type?: string;
  page?: string;
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
  const pageParam = Number.parseInt(resolvedSearch?.page ?? "1", 10) || 1;
  const typeSet = new Set(posts.map((p) => p.type).filter(Boolean));
  // Fixed order: Essay → Weekly → Diary
  const typeOrder = ["essay", "weekly", "diary"];
  const availableTypes = typeOrder.filter((t) => typeSet.has(t));

  // Type label map for display
  const typeLabelMap: Record<string, string> = {
    essay: "Essay",
    diary: "Diary",
    weekly: "Weekly",
  };
  const filtered =
    typeParam && availableTypes.includes(typeParam)
      ? posts.filter((post) => post.type === typeParam)
      : posts;
  const PAGE_SIZE = 6;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(pageParam, 1), totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  const buildHref = (page: number) => {
    const params = new URLSearchParams();
    if (typeParam) params.set("type", typeParam);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `/blog?${qs}` : "/blog";
  };

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
                ? "border-[var(--accent-strong)] bg-[var(--highlight)]/60 text-[var(--foreground)]"
                : "border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
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
                  ? "border-[var(--accent-strong)] bg-[var(--highlight)]/60 text-[var(--foreground)]"
                  : "border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              }`}
            >
              {typeLabelMap[type ?? ""] || type}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="space-y-5">
        {visible.map((post) => (
          <article
            key={post.slug}
            className="surface-card px-5 py-4 transition-transform hover:-translate-y-0.5"
          >
            {post.image ? (
              <div className="mb-3 overflow-hidden rounded-md border border-[var(--border)]">
                <Image
                  src={post.image}
                  alt={post.title}
                  width={900}
                  height={900}
                  className="aspect-[3/2] w-full object-cover"
                  sizes="(min-width: 640px) 50vw, 100vw"
                  unoptimized
                  priority={false}
                />
              </div>
            ) : null}
            <div className="flex items-center justify-between text-sm text-[var(--muted)]">
              <span>{typeLabelMap[post.type ?? ""] || post.type}</span>
              <span>{post.publishedAt}</span>
            </div>
            <h2 className="pt-1 text-2xl font-semibold text-[var(--foreground)]">
              <Link href={`/blog/${post.slug}`} className="hover:text-[var(--accent)]">
                {post.title}
              </Link>
            </h2>

            <p className="text-[var(--muted)] leading-relaxed">{post.excerpt}</p>
            <div className="pt-2 text-sm text-[var(--muted)]">
              {post.readingTime ? `${post.readingTime} read` : "Read time TBD"}
            </div>
          </article>
        ))}
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between pt-2 text-sm text-[var(--muted)]">
          {/* 邊界時渲染 <span> 而非 <Link>：aria-disabled + pointer-events-none
              擋得住滑鼠，擋不住鍵盤 Enter */}
          {currentPage === 1 ? (
            <span className="underline decoration-[var(--border)] underline-offset-8 opacity-50">
              上一頁
            </span>
          ) : (
            <Link
              href={buildHref(currentPage - 1)}
              className="underline decoration-[var(--border)] underline-offset-8 transition-colors hover:text-[var(--accent)]"
            >
              上一頁
            </Link>
          )}
          <span>
            第 {currentPage} / {totalPages} 頁
          </span>
          {currentPage === totalPages ? (
            <span className="underline decoration-[var(--border)] underline-offset-8 opacity-50">
              下一頁
            </span>
          ) : (
            <Link
              href={buildHref(currentPage + 1)}
              className="underline decoration-[var(--border)] underline-offset-8 transition-colors hover:text-[var(--accent)]"
            >
              下一頁
            </Link>
          )}
        </div>
      ) : null}
    </main>
  );
}
