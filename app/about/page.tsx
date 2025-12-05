import Link from "next/link";
import { loadSiteCopy } from "@/lib/content";

export default async function AboutPage() {
  const copy = await loadSiteCopy();
  return (
    <main className="page-shell space-y-6">
      <header className="space-y-2">
        <span className="section-title">About</span>
        <h1 className="text-3xl font-semibold text-[var(--foreground)]">Yi-Hsiang Chao, MD</h1>
        <p className="max-w-2xl text-base text-[var(--muted)]">{copy.aboutIntro}</p>
      </header>

      <div className="space-y-4 text-[var(--muted)]">
        <p>{copy.aboutBody}</p>
        <p>
          For speaking, collaboration, or a quick hello:{" "}
          <Link
            href="mailto:hello@wilsonchao.com"
            className="font-medium text-[var(--foreground)] underline decoration-[var(--border)] underline-offset-8 hover:text-[var(--accent)]"
          >
            hello@wilsonchao.com
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
