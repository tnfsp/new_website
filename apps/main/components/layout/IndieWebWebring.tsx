export function IndieWebWebring() {
  return (
    <div className="page-shell pb-10">
      <div className="surface-card px-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="inline-flex h-2.5 w-2.5 items-center justify-center rounded-full bg-[var(--accent)]"
              />
              <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
                IndieWeb Webring
              </span>
            </div>
            <p className="text-sm leading-relaxed text-[var(--muted)]">
              看看更多其他獨立作者經營的網站，沿著 Webring 逛逛鄰居。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--foreground)] sm:shrink-0">
            <a
              href="https://xn--sr8hvo.ws/previous"
              className="rounded-full border border-[var(--border)] px-3 py-1 transition-colors hover:border-[var(--accent-strong)] hover:text-[var(--accent)]"
              rel="noopener noreferrer"
              target="_blank"
            >
              &larr; Prev
            </a>
            <span className="text-[var(--muted)]">/</span>
            <a
              href="https://xn--sr8hvo.ws/"
              className="rounded-full border border-[var(--border)] px-3 py-1 transition-colors hover:border-[var(--accent-strong)] hover:text-[var(--accent)]"
              rel="noopener noreferrer"
              target="_blank"
            >
              Webring Hub
            </a>
            <span className="text-[var(--muted)]">/</span>
            <a
              href="https://xn--sr8hvo.ws/next"
              className="rounded-full border border-[var(--border)] px-3 py-1 transition-colors hover:border-[var(--accent-strong)] hover:text-[var(--accent)]"
              rel="noopener noreferrer"
              target="_blank"
            >
              Next &rarr;
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
