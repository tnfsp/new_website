import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, loadProjects } from "@/lib/content";
import { ViewCounter } from "@/components/ui/ViewCounter";
import { LikeButton } from "@/components/ui/LikeButton";

export default async function DailyEntryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = await getProject(slug);
  if (!entry) notFound();

  const all = await loadProjects();
  const index = all.findIndex((item) => item.slug === slug);
  const prev = index > 0 ? all[index - 1] : null;
  const next = index >= 0 && index < all.length - 1 ? all[index + 1] : null;
  const bodyHtml = entry.contentHtml;
  const firstBodyImageSrc = bodyHtml
    ? bodyHtml.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1]
    : undefined;
  const heroImage = entry.image && entry.image !== firstBodyImageSrc ? entry.image : undefined;

  return (
    <main className="page-shell space-y-6">
      <Link
        href="/daily"
        className="text-sm font-medium text-[var(--foreground)] underline decoration-[var(--border)] underline-offset-8 hover:text-[var(--accent)]"
      >
        Back to daily
      </Link>

      <article className="surface-card space-y-3 px-6 py-5">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
          {entry.type || "Daily"}
        </p>
        <h1 className="text-3xl font-semibold leading-tight text-[var(--foreground)]">{entry.title}</h1>
        <p className="text-sm text-[var(--muted)]">{entry.date}</p>
        <ViewCounter slug={entry.slug || entry.title} />
        {entry.description ? (
          <p className="text-base text-[var(--muted)] leading-relaxed">{entry.description}</p>
        ) : null}
        {heroImage ? (
          <div className="overflow-hidden rounded-lg border border-[var(--border)]">
            <Image
              src={heroImage}
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
        {bodyHtml ? (
          <div
            className="prose prose-neutral max-w-none text-[var(--foreground)] prose-a:text-[var(--accent)] [&_h1]:block [&_h1]:w-fit [&_h1]:bg-[var(--highlight)] [&_h1]:px-2 [&_h1]:py-0.5 [&_h1]:rounded [&_h2]:block [&_h2]:w-fit [&_h2]:bg-[var(--highlight)] [&_h2]:px-2 [&_h2]:py-0.5 [&_h2]:rounded [&_h3]:block [&_h3]:w-fit [&_h3]:bg-[var(--highlight)] [&_h3]:px-2 [&_h3]:py-0.5 [&_h3]:rounded"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        ) : entry.content ? (
          <pre className="whitespace-pre-wrap text-base leading-relaxed text-[var(--foreground)]">
            {entry.content}
          </pre>
        ) : null}
        <div className="pt-4">
          <LikeButton slug={`daily:${entry.slug || entry.title}`} />
        </div>
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
