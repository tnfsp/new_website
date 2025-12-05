import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, loadProjects } from "@/lib/content";

export default async function DailyEntryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = await getProject(slug);
  if (!entry) notFound();

  const all = await loadProjects();
  const index = all.findIndex((item) => item.slug === slug);
  const prev = index > 0 ? all[index - 1] : null;
  const next = index >= 0 && index < all.length - 1 ? all[index + 1] : null;

  return (
    <main className="page-shell space-y-6">
      <Link
        href="/daily"
        className="text-sm font-medium text-[var(--foreground)] underline decoration-[var(--border)] underline-offset-8 hover:text-[var(--accent)]"
      >
        Back to daily
      </Link>

      <article className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
          {entry.type || "Daily"}
        </p>
        <h1 className="text-3xl font-semibold leading-tight text-[var(--foreground)]">{entry.title}</h1>
        <p className="text-sm text-[var(--muted)]">{entry.date}</p>
        <p className="text-base text-[var(--muted)] leading-relaxed">{entry.description}</p>
        {entry.image ? (
          <div className="pt-2">
            {/* using img to avoid remote config; recommended to store in public */}
            <img
              src={entry.image}
              alt={entry.title}
              className="w-full rounded-lg border border-[var(--border)] object-cover"
            />
          </div>
        ) : null}
      </article>

      {(prev || next) && (
        <div className="flex justify-between border-t border-[var(--border)] pt-4 text-sm text-[var(--muted)]">
          <div className="max-w-sm">
            {prev ? (
              <Link href={`/daily/${prev.slug}`} className="hover:text-[var(--accent)]">
                ← {prev.title}
              </Link>
            ) : (
              <span />
            )}
          </div>
          <div className="max-w-sm text-right">
            {next ? (
              <Link href={`/daily/${next.slug}`} className="hover:text-[var(--accent)]">
                {next.title} →
              </Link>
            ) : (
              <span />
            )}
          </div>
        </div>
      )}
    </main>
  );
}
