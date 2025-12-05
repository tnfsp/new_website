import Link from "next/link";
import { loadProjects, loadSiteCopy } from "@/lib/content";

export default async function ProjectsPage() {
  const projects = await loadProjects();
  const copy = await loadSiteCopy();
  return (
    <main className="page-shell space-y-6">
      <header className="space-y-2">
        <span className="section-title">Daily</span>
        <h1 className="text-3xl font-semibold text-[var(--foreground)]">{copy.projectsTitle}</h1>
        <p className="max-w-2xl text-base text-[var(--muted)]">{copy.projectsIntro}</p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2">
        {projects.map((project) => (
          <div
            key={project.title}
            className="rounded-lg border border-[var(--border)] bg-white/85 px-5 py-4"
          >
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
              <span>{project.type || "Project"}</span>
              <span>{project.date || ""}</span>
            </div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              {project.slug
                ? (
                  <Link href={`/projects/${project.slug}`} className="hover:text-[var(--accent)]">
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
