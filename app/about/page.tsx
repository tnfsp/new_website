import { loadSiteCopy } from "@/lib/content";

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function toHtml(value?: string) {
  if (!value) return "";
  if (value.includes("<")) return value;
  return value
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join("");
}

export default async function AboutPage() {
  const copy = await loadSiteCopy();

  return (
    <main className="page-shell space-y-6">
      <header className="space-y-3">
        <span className="section-title">About</span>
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-4">
            {copy.aboutImage ? (
              // Use plain img to avoid remote domain config; suggest storing in /public.
              <img
                src={copy.aboutImage}
                alt="Portrait"
                className="h-20 w-20 rounded-full border border-[var(--border)] object-cover"
                loading="lazy"
              />
            ) : null}
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold text-[var(--foreground)]">{copy.aboutName}</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-4 text-[var(--muted)]">
        <div
          className="[&_p]:my-3 [&_p]:leading-relaxed [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-[var(--foreground)] [&_h2]:text-xl [&_h3]:text-lg [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--border)] [&_blockquote]:pl-3 [&_blockquote]:italic"
          dangerouslySetInnerHTML={{ __html: toHtml(copy.aboutBody) }}
        />
      </div>
    </main>
  );
}
