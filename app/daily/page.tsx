import Image from "next/image";
import Link from "next/link";
import { loadProjects, loadSiteCopy } from "@/lib/content";

type SearchParams = {
  type?: string;
  page?: string;
};

export default async function DailyPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const projects = await loadProjects();
  const copy = await loadSiteCopy();
  const resolvedSearch = await searchParams;
  const typeParam = resolvedSearch?.type;
  const pageParam = Number.parseInt(resolvedSearch?.page ?? "1", 10) || 1;
  const availableTypes = Array.from(new Set(projects.map((p) => p.type).filter(Boolean))).sort();
  const filtered =
    typeParam && availableTypes.includes(typeParam)
      ? projects.filter((project) => project.type === typeParam)
      : projects;
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
    return qs ? `/daily?${qs}` : "/daily";
  };
  return (
    <main className="page-shell space-y-6">
      <header className="space-y-2">
        <span className="section-title">Daily</span>
        <h1 className="text-3xl font-semibold text-[var(--foreground)]">{copy.projectsTitle}</h1>
        <p className="max-w-2xl text-base text-[var(--muted)]">{copy.projectsIntro}</p>
      </header>

      {availableTypes.length > 0 ? (
        <div className="flex flex-wrap gap-2 text-sm text-[var(--muted)]">
          <Link
            href="/daily"
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
              href={`/daily?type=${encodeURIComponent(type ?? "")}`}
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

      <div className="grid gap-5 sm:grid-cols-2">
        {visible.map((project) => (
          <div
            key={project.title}
            className="rounded-lg border border-[var(--border)] bg-white/85 px-5 py-4"
          >
            {project.image ? (
              <div className="mb-3 overflow-hidden rounded-md border border-[var(--border)]">
                <Image
                  src={project.image}
                  alt={project.title}
                  width={800}
                  height={360}
                  className="h-36 w-full object-cover"
                  sizes="(min-width: 640px) 50vw, 100vw"
                  unoptimized
                  priority={false}
                />
              </div>
            ) : null}
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
              <span>{project.type || "Daily"}</span>
              <span>{project.date || ""}</span>
            </div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
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
            </h2>
            <p className="text-sm text-[var(--muted)]">
              {project.excerpt || project.description}
            </p>
          </div>
        ))}
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between pt-2 text-sm text-[var(--muted)]">
          <Link
            href={buildHref(Math.max(1, currentPage - 1))}
            aria-disabled={currentPage === 1}
            className={`underline decoration-[var(--border)] underline-offset-8 transition-colors hover:text-[var(--accent)] ${
              currentPage === 1 ? "pointer-events-none opacity-50" : ""
            }`}
          >
            上一頁
          </Link>
          <span>
            第 {currentPage} / {totalPages} 頁
          </span>
          <Link
            href={buildHref(Math.min(totalPages, currentPage + 1))}
            aria-disabled={currentPage === totalPages}
            className={`underline decoration-[var(--border)] underline-offset-8 transition-colors hover:text-[var(--accent)] ${
              currentPage === totalPages ? "pointer-events-none opacity-50" : ""
            }`}
          >
            下一頁
          </Link>
        </div>
      ) : null}
    </main>
  );
}
