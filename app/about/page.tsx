import { loadSiteCopy, loadBlogEntries } from "@/lib/content";

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function fallbackHtmlFromContent(content?: string) {
  if (!content) return "";
  return content
    .split(/\n{2,}/)
    .map((paragraph) => escapeHtml(paragraph.trim()))
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph}</p>`)
    .join("");
}

export default async function AboutPage() {
  const copy = await loadSiteCopy();
  const blogEntries = await loadBlogEntries();
  const aboutEntry =
    blogEntries.find((entry) => entry.type?.toLowerCase() === "about") ||
    blogEntries.find((entry) => entry.slug === "about");

  const bodyHtml = aboutEntry?.contentHtml || fallbackHtmlFromContent(aboutEntry?.content);

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
              <h1 className="text-3xl font-semibold text-[var(--foreground)]">Yi-Hsiang Chao, MD</h1>
              <p className="max-w-2xl text-base text-[var(--muted)]">{copy.aboutIntro}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-4 text-[var(--muted)]">
        {bodyHtml ? (
          <div
            className="[&_p]:my-3 [&_p]:leading-relaxed [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-[var(--foreground)] [&_h2]:text-xl [&_h3]:text-lg [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--border)] [&_blockquote]:pl-3 [&_blockquote]:italic"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        ) : (
          <p>{copy.aboutBody}</p>
        )}
      </div>
    </main>
  );
}
