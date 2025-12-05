import Link from "next/link";
import { loadProjects } from "@/lib/content";

export default async function ProjectsPage() {
  const projects = await loadProjects();
  return (
    <main className="page-shell space-y-6">
      <header className="space-y-2">
        <span className="section-title">Projects</span>
        <h1 className="text-3xl font-semibold text-[var(--foreground)]">Research & ongoing work</h1>
        <p className="max-w-2xl text-base text-[var(--muted)]">
          Selected case studies, research notes, and writing experiments. This list will eventually
          sync from Notion.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {projects.map((project) => (
          <div
            key={project.title}
            className="rounded-xl border border-[var(--border)] bg-white/80 px-4 py-4 shadow-[0_4px_24px_rgba(0,0,0,0.02)]"
          >
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              <Link href={project.href} className="hover:text-[var(--accent)]">
                {project.title}
              </Link>
            </h2>
            <p className="text-sm text-[var(--muted)]">{project.description}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
