import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) {
    notFound();
  }

  return (
    <main className="page-shell space-y-6">
      <Link
        href="/projects"
        className="text-sm font-medium text-[var(--foreground)] underline decoration-[var(--border)] underline-offset-8 hover:text-[var(--accent)]"
      >
        Back to projects
      </Link>
      <article className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          {project.type || "Project"}
        </p>
        <h1 className="text-3xl font-semibold leading-tight text-[var(--foreground)]">
          {project.title}
        </h1>
        {project.date ? (
          <p className="text-sm text-[var(--muted)]">{project.date}</p>
        ) : null}
        {project.description ? (
          <p className="text-base text-[var(--muted)] leading-relaxed">{project.description}</p>
        ) : (
          <p className="text-base text-[var(--muted)] leading-relaxed">
            More details coming soon.
          </p>
        )}
      </article>
    </main>
  );
}
