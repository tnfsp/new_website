export default function NowPage() {
  return (
    <main className="page-shell space-y-4">
      <header className="space-y-2">
        <span className="section-title">Now</span>
        <h1 className="text-3xl font-semibold text-[var(--foreground)]">What I&apos;m focusing on</h1>
      </header>
      <div className="space-y-3 text-[var(--muted)]">
        <p>Keeping cases calm, writing shorter entries more frequently, and walking longer.</p>
        <p>
          This page is optional and will sync with Notion later. For now, it serves as a placeholder
          for a living /now update.
        </p>
      </div>
    </main>
  );
}
