import type { Metadata } from "next";
import Link from "next/link";
import { CopyButton } from "@/components/ui/CopyButton";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://wilsonchao.com";

export const metadata: Metadata = {
  title: "RSS Feeds — Wilson Chao",
  description: "訂閱 wilsonchao.com 的 RSS feeds — Blog、Stream。",
  alternates: { canonical: `${BASE_URL}/feed` },
  openGraph: {
    title: "RSS Feeds — Wilson Chao",
    description: "訂閱 wilsonchao.com 的 RSS feeds — Blog、Stream。",
    url: `${BASE_URL}/feed`,
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
};

const feeds = [
  {
    name: "All",
    path: "/feed.xml",
    description: "所有內容：Essay、Hospital 筆記、Life 隨筆、Weekly 週報，一個 feed 搞定。",
    emoji: "📡",
  },
  {
    name: "Blog",
    path: "/blog/feed.xml",
    description: "長文：醫學、故事、思考。不定期更新。",
    emoji: "📝",
  },
  {
    name: "Stream",
    path: "/stream/feed.xml",
    description: "日常的腦內碎片——想法、電影、音樂。幾乎每天。",
    emoji: "🌊",
  },
];

function subscribeLinks(feedUrl: string) {
  return [
    { label: "RSS", href: feedUrl },
  ];
}

export default function FeedPage() {
  return (
    <main className="page-shell space-y-6">
      <header className="space-y-2">
        <span className="section-title">RSS</span>
        <h1 className="text-3xl font-semibold text-[var(--foreground)]">Subscribe</h1>
        <p className="max-w-2xl text-base text-[var(--muted)]">
          用你喜歡的 RSS reader 訂閱。不用帳號、不用演算法。
        </p>
      </header>

      <div className="space-y-4">
        {feeds.map((feed) => {
          const fullUrl = `${BASE_URL}${feed.path}`;
          const links = subscribeLinks(fullUrl);
          return (
            <div
              key={feed.name}
              className="surface-card space-y-3 rounded-xl border border-[var(--border)] px-5 py-4"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{feed.emoji}</span>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">{feed.name}</h2>
              </div>
              <p className="text-sm leading-relaxed text-[var(--muted)]">{feed.description}</p>

              {/* Subscribe buttons — stack on mobile, row on desktop */}
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                {links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--foreground)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    用 {link.label} 訂閱
                  </a>
                ))}
                <CopyButton url={fullUrl} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer: OPML + RSS explanation */}
      <div className="space-y-3 border-t border-[var(--border)] pt-6 text-sm text-[var(--muted)]">
        <p>
          用其他 reader？{" "}
          <Link
            href="/feed/opml"
            className="inline-link"
            download="wilsonchao-feeds.opml"
          >
            下載 OPML
          </Link>
          {" "}一次匯入全部 feed。
        </p>
        <p>
          <strong className="text-[var(--foreground)]">什麼是 RSS？</strong>{" "}
          一種讓你在自己的 reader 裡追蹤網站更新的格式。推薦用{" "}
          <a
            href="https://readwise.io/read"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-link"
          >
            Readwise Reader
          </a>
          、
          <a
            href="https://netnewswire.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-link"
          >
            NetNewsWire
          </a>{" "}
          或{" "}
          <a
            href="https://feedly.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-link"
          >
            Feedly
          </a>
          。
        </p>
      </div>
    </main>
  );
}
