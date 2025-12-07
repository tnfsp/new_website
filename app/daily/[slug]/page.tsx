import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, loadProjects } from "@/lib/content";
import { ViewCounter } from "@/components/ui/ViewCounter";

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
        <ViewCounter slug={entry.slug || entry.title} />
        {entry.description ? (
          <p className="text-base text-[var(--muted)] leading-relaxed">{entry.description}</p>
        ) : null}
        {entry.image ? (
          <div className="overflow-hidden rounded-lg border border-[var(--border)]">
            <Image
              src={entry.image}
              alt={entry.title}
              width={1200}
              height={630}
              className="w-full object-cover"
              sizes="100vw"
              unoptimized
              priority={false}
            />
          </div>
        ) : null}
        {entry.contentHtml ? (
          <div
            className="prose prose-neutral max-w-none text-[var(--foreground)] prose-a:text-[var(--accent)]"
            dangerouslySetInnerHTML={{ __html: entry.contentHtml }}
          />
        ) : entry.content ? (
          <pre className="whitespace-pre-wrap text-base leading-relaxed text-[var(--foreground)]">
            {entry.content}
          </pre>
        ) : null}
      </article>

      {(prev || next) && (
        <div className="flex justify-between border-t border-[var(--border)] pt-4 text-sm text-[var(--muted)]">
          <div className="max-w-sm">
            {prev ? (
              <Link href={`/daily/${prev.slug}`} className="hover:text-[var(--accent)]">
                {"<-"} {prev.title}
              </Link>
            ) : (
              <span />
            )}
          </div>
          <div className="max-w-sm text-right">
            {next ? (
              <Link href={`/daily/${next.slug}`} className="hover:text-[var(--accent)]">
                {next.title} {"->"}
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
