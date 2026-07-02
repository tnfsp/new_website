/**
 * /owl nested layout — scopes the two serif typefaces to the entire /owl/* tree.
 *
 * Noto Serif TC  → CJK body text (--font-owl-serif-zh)
 * Newsreader     → Latin headings, pull-quotes, bylines (--font-owl-serif-en)
 *
 * Both CSS variables are injected on the `.owl-page` wrapper div so they never
 * reach the root <body>, leaving the site-wide Geist / Noto Sans TC untouched.
 */

import { Noto_Serif_TC, Newsreader } from "next/font/google";

// CJK serif — body text, flowing prose
const notoSerifTC = Noto_Serif_TC({
  variable: "--font-owl-serif-zh",
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  // CJK subsets are loaded on demand via unicode-range; preload off to avoid
  // downloading the entire CJK font on every page load.
  preload: false,
});

// Latin serif — headings, pull-quotes, byline accents
const newsreader = Newsreader({
  variable: "--font-owl-serif-en",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

export default function OwlLayout({ children }: { children: React.ReactNode }) {
  return (
    // The two font CSS variables are attached here; .owl-page applies the paper
    // background + ink text color that define the /owl visual identity.
    // suppressHydrationWarning：下面的 inline script 會在 hydration 前
    // 加上 owl-js class（跟 theme script 同一招），className 必然跟
    // server HTML 不同，這是刻意的。
    <div
      className={`owl-page ${notoSerifTC.variable} ${newsreader.variable}`}
      suppressHydrationWarning
    >
      {/* 在 paint 前同步加上 owl-js class：.owl-reveal 的隱藏樣式只在
          .owl-page.owl-js 底下生效（見 globals.css）。沒有 JS（或 script
          被擋、hydration 前）時 class 不存在，內容直接可見——避免整頁
          因為 IntersectionObserver 沒跑而永遠 opacity:0。 */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "document.currentScript.parentElement.classList.add('owl-js')",
        }}
      />
      {children}
    </div>
  );
}
