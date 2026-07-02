import type { NowDynamicItem } from "@/lib/now";
import { YouTubeEmbed } from "./YouTubeEmbed";

interface Props {
  dynamic: {
    music: NowDynamicItem[];
    video: NowDynamicItem[];
    reading: NowDynamicItem[];
    fragments: NowDynamicItem[];
  };
}

function formatDate(iso: string) {
  // new Date() 不會 throw，壞字串只會變 Invalid Date——要用 getTime() 檢查
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("zh-TW", { month: "short", day: "numeric" });
}

function MediaSection({
  emoji,
  title,
  items,
}: {
  emoji: string;
  title: string;
  items: NowDynamicItem[];
}) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-[var(--foreground)]">
        {emoji} {title}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.streamId} className="space-y-2">
            {item.youtubeId ? (
              <YouTubeEmbed videoId={item.youtubeId} title={item.title} />
            ) : item.image ? (
              <div className="aspect-video overflow-hidden rounded-lg bg-[var(--surface)]">
                <img src={item.image} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
              </div>
            ) : null}
            <div>
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--accent)]"
                >
                  {item.title}
                </a>
              ) : (
                <p className="text-sm font-medium text-[var(--foreground)]">{item.title}</p>
              )}
              <p className="text-xs text-[var(--muted)]/60">{formatDate(item.date)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReadingSection({ items }: { items: NowDynamicItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-[var(--foreground)]">📖 最近在讀</h2>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.streamId}
            className="flex items-baseline justify-between gap-3 rounded-lg border border-[var(--border)] px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm inline-link"
                >
                  {item.title}
                </a>
              ) : (
                <p className="text-sm text-[var(--foreground)]">{item.title}</p>
              )}
              {item.description && (
                <p className="mt-1 text-xs text-[var(--muted)]">{item.description}</p>
              )}
            </div>
            <span className="shrink-0 text-xs text-[var(--muted)]/60">{formatDate(item.date)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function FragmentsSection({ items }: { items: NowDynamicItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-[var(--foreground)]">🌊 最近的碎片</h2>
      <div className="space-y-2">
        {items.map((item) => (
          <blockquote
            key={item.streamId}
            className="border-l-2 border-[var(--border)] py-1 pl-4"
          >
            <p className="text-sm leading-relaxed text-[var(--muted)]">
              {item.title.length > 120 ? item.title.slice(0, 117) + "..." : item.title}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]/50">{formatDate(item.date)}</p>
          </blockquote>
        ))}
      </div>
    </section>
  );
}

export function NowDynamicGrid({ dynamic }: Props) {
  const hasAny = Object.values(dynamic).some((arr) => arr.length > 0);
  if (!hasAny) return null;

  return (
    <div className="space-y-6">
      <MediaSection emoji="🎵" title="最近在聽" items={dynamic.music} />
      <MediaSection emoji="🎬" title="最近在看" items={dynamic.video} />
      <ReadingSection items={dynamic.reading} />
      <FragmentsSection items={dynamic.fragments} />
    </div>
  );
}
