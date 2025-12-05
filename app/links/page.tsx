import Link from "next/link";
import { linkItems } from "@/lib/content";

export default function LinksPage() {
  return (
    <main className="page-shell space-y-4">
      <header className="space-y-2 text-center">
        <span className="section-title">Links</span>
        <h1 className="text-3xl font-semibold text-[var(--foreground)]">Hello there</h1>
        <p className="text-base text-[var(--muted)]">
          Quick paths to the places I write and share updates.
        </p>
      </header>

      <div className="mx-auto flex max-w-md flex-col gap-3">
        {linkItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="rounded-full border border-[var(--border)] bg-white/80 px-4 py-3 text-center text-[var(--foreground)] shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-colors hover:text-[var(--accent)]"
            target={item.external ? "_blank" : undefined}
            rel={item.external ? "noreferrer" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </main>
  );
}
