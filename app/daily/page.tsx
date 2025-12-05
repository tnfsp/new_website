import Link from "next/link";
import { loadProjects, loadSiteCopy } from "@/lib/content";

type SearchParams = {
  type?: string;
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
  const availableTypes = Array.from(new Set(projects.map((p) => p.type).filter(Boolean))).sort();
  const filtered =
    typeParam && availableTypes.includes(typeParam)
      ? projects.filter((project) => project.type === typeParam)
      : projects;
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
        {filtered.map((project) => (
          <div
            key={project.title}
            className="rounded-lg border border-[var(--border)] bg-white/85 px-5 py-4"
          >
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
            <p className="text-sm text-[var(--muted)]">{project.description}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
