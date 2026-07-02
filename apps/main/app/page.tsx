import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { loadBlogEntries } from "@/lib/content";
import { SubscribeForm } from "@/components/ui/SubscribeForm";
import { WritingHeatmap } from "@/components/ui/WritingHeatmap";
import { BASE_URL } from "@/lib/constants";
import { jsonLdString } from "@/lib/json-ld";

export const metadata: Metadata = {
  alternates: { canonical: BASE_URL },
};

// 排程發布（publishedAt 到期自動上線）需要定期重算——
// 沒有 revalidate 的話「最近寫的」只會在 deploy 時更新
export const revalidate = 300;

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "wilsonchao.com",
  url: BASE_URL,
  description: "趙玴祥（Yi-Hsiang Chao, MD）— 心臟血管外科醫師、寫作者、思考者的個人網站。",
  author: {
    "@type": ["Person", "Physician"],
    "@id": `${BASE_URL}/#person`,
    name: "趙玴祥",
    alternateName: ["Yi-Hsiang Chao", "Wilson Chao"],
    url: `${BASE_URL}/about`,
    jobTitle: "心臟血管外科醫師",
    affiliation: {
      "@type": "Hospital",
      name: "高雄醫學大學附設中和紀念醫院",
    },
  },
};

/** Slugs for the "精選" section — edit here to change featured articles */
const FEATURED_SLUGS = ["no-name-doctor", "ideal-daily-life", "not-privilege"] as const;

/** Navigation cards for the "如何逛這個地方" section */
const NAV_CARDS = [
  {
    label: "Blog",
    href: "/blog",
    cta: "想看故事",
    desc: "手術室裡的事、凌晨的事，還有那些我還想不通的事。",
  },
  {
    label: "About",
    href: "/about",
    cta: "想認識我這個人",
    desc: "我的名字、我的弱點、我還沒想通的問題，都攤在這。",
  },
  {
    label: "Now",
    href: "/now",
    cta: "想知道我「現在」在忙什麼",
    desc: "當下最佔據我的事。",
  },
];

export default async function Home() {
  const blogEntries = await loadBlogEntries();

  // Tag label mapping
  const tagLabelMap: Record<string, string> = {
    essay: "Essay",
    weekly: "Weekly",
    "週報": "Weekly",
    diary: "Diary",
  };

  // Build featuredItems from FEATURED_SLUGS (preserve order, skip missing)
  const featuredItems = FEATURED_SLUGS
    .map((slug) => blogEntries.find((e) => e.slug === slug))
    .filter((e): e is NonNullable<typeof e> => e != null);

  // Build recentItems from all blog entries
  type RecentItem = { title: string; href: string; date: string; tag?: string; desc?: string };
  const recentItems: RecentItem[] = blogEntries
    .map((post) => ({
      title: post.title,
      href: `/blog/${post.slug}`,
      date: post.publishedAt || "",
      tag: tagLabelMap[post.type || ""] || post.type || "",
      desc: post.description || post.excerpt || "",
    }))
    .filter((item) => item.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(websiteJsonLd) }}
      />
      <main className="page-shell space-y-16">

        {/* A. Hero — 大頭貼 + 問候（沿用舊版排版）+ 大字 */}
        <header className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full sm:h-20 sm:w-20">
              <Image
                src="/hero.jpg"
                alt="趙玴祥 Wilson Chao"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
                嗨，我是玴祥
              </p>
              <p className="text-sm text-[var(--muted)]">心臟外科醫師 · 對世界好奇的人</p>
            </div>
          </div>
          <h1 className="text-4xl font-bold leading-[1.15] text-[var(--foreground)] sm:text-5xl">
            <span className="block">白天打開心臟</span>
            <span className="block">晚上把心事寫下來</span>
          </h1>
        </header>

        {/* B. 長合約 */}
        <section className="prose max-w-none">
          <p>
            這裡沒有知識焦慮，也沒有什麼非看不可的東西，其實只是一個個人碎唸的小天地，偶爾寫手術室裡的故事，也寫凌晨睡不著時心裡的事。
          </p>
          <p>
            曾經汲汲營營於變得更強，凡事都希望能更有生產力，現在則開始新生活運動，在這裡寫些我探索自我的過程，偶爾也把脆弱的一面寫下來。
          </p>
          <p>
            但是寫下來，其實真的是一件難為情又害羞的事情，有時也會納悶，自己為何要做這件事情？被熟識的人看到，不是把自己置於被評價的危險之中？
          </p>
          <p>
            於是寫了又刪，刪了又寫，在這個糾結中，我發現我是如此的孤單，在這麼大的世界中，我感受到強烈的孤獨感：「難道，竟然沒有人像我一樣嗎？」
          </p>
          <p>
            所以答案竟藏在問題中，至少我目前是這麼認為的，在這個角落持續敲打拍出聲響，也許總會遇到一些奇怪的同類吧！
          </p>
          <p>
            PS：如果你也有所共鳴，請
            <a href="mailto:hi@wilsonchao.com">寄信給我</a>
            ！
          </p>
        </section>

        {/* 如何逛這個地方 — wayfinding，放在前面當入口 */}
        <section className="space-y-5">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">如何逛這個地方？</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {NAV_CARDS.map((card) => (
              <Link
                key={card.label}
                href={card.href}
                className="surface-card block px-5 py-4 transition-transform hover:-translate-y-0.5 hover:shadow-[0_28px_70px_rgba(0,18,25,0.12)]"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-1">
                  {card.cta}
                </p>
                <p className="font-semibold text-[var(--foreground)] text-base mb-1">
                  {card.label}
                </p>
                <p className="text-sm text-[var(--muted)] leading-relaxed">
                  {card.desc}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* 精選 — hand-picked articles grid */}
        {featuredItems.length > 0 && (
          <section className="space-y-4">
            <span className="section-title">精選</span>
            <div className="grid gap-4 sm:grid-cols-3">
              {featuredItems.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="surface-card block px-5 py-4 transition-transform hover:-translate-y-0.5 hover:shadow-[0_28px_70px_rgba(0,18,25,0.12)]"
                >
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-1">
                    {tagLabelMap[post.type || ""] || post.type || "文章"}
                  </p>
                  <p className="font-semibold text-base text-[var(--foreground)] mb-1">
                    {post.title}
                  </p>
                  <p className="text-sm text-[var(--muted)] leading-relaxed line-clamp-3">
                    {post.description || post.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 最近寫的 — low-key strip at the bottom */}
        {recentItems.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="section-title">最近寫的</span>
              <Link
                href="/blog"
                className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--accent-strong)]"
              >
                全部文章 →
              </Link>
            </div>
            <WritingHeatmap weeks={20} />
            <ul className="divide-y divide-[var(--border)]">
              {recentItems.map((item) => (
                <li key={item.href} className="group">
                  <Link
                    href={item.href}
                    className="-mx-3 block rounded-md px-3 py-3.5 transition-colors hover:bg-[var(--highlight)]/30"
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <div className="flex min-w-0 items-baseline gap-2.5">
                        {item.tag ? (
                          <span className="flex-shrink-0 rounded-full border border-[var(--border)] px-2 py-0.5 text-xs font-medium text-[var(--accent-strong)]">
                            {item.tag}
                          </span>
                        ) : null}
                        <span className="min-w-0 truncate text-base font-medium text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)]">
                          {item.title}
                        </span>
                      </div>
                      <span className="flex-shrink-0 text-xs tabular-nums text-[var(--muted)] opacity-60">
                        {item.date}
                      </span>
                    </div>
                    {item.desc ? (
                      <p className="mt-1 truncate text-sm leading-relaxed text-[var(--muted)]">
                        {item.desc}
                      </p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 結尾邀請 — subscribe CTA，收束在頁尾（讀完內容才開口邀請） */}
        <section id="subscribe" className="surface-strong px-6 py-7 space-y-5">
          <p className="text-lg font-medium text-[var(--foreground)] leading-relaxed">
            如果你也是奇怪的人，來聊聊！
          </p>
          <div className="space-y-2">
            <p className="text-sm text-[var(--muted)]">訂閱每週一封信，直接寄到你信箱：</p>
            <SubscribeForm source="home" />
          </div>
          <p className="text-sm text-[var(--muted)]">
            或直接寫信：{" "}
            <a href="mailto:hi@wilsonchao.com" className="inline-link">
              hi@wilsonchao.com
            </a>
          </p>
        </section>

        {/* Footer */}
        <footer className="border-t border-[var(--border)] pt-6 text-sm text-[var(--muted)]">
          只代表個人意見，半手工打造
        </footer>
      </main>
    </>
  );
}
