"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SearchBox } from "@/components/ui/SearchBox";

function RssIcon() {
  return (
    <Link
      href="/feed"
      className="flex items-center rounded-full px-2 py-1 text-sm text-[var(--muted)] transition-colors hover:bg-[var(--highlight)]/60 hover:text-[var(--accent)]"
      aria-label="RSS Feed"
      title="RSS Feed"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 11a9 9 0 0 1 9 9" />
        <path d="M4 4a16 16 0 0 1 16 16" />
        <circle cx="5" cy="19" r="1" />
      </svg>
    </Link>
  );
}

const links = [
  { href: "/blog", label: "Blog" },
  { href: "/stream", label: "Stream" },
  { href: "/clinic", label: "Clinic" },
  { href: "/now", label: "Now" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="page-shell">
        <div className="flex items-center justify-between gap-4 rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-3 shadow-[0_16px_40px_rgba(0,18,25,0.08)] backdrop-blur">
          <Link href="/" className="flex items-center gap-3" aria-label="Go to homepage">
            <Image
              src="/avatar.png"
              alt="Yi-Hsiang Chao portrait"
              width={56}
              height={56}
              className="h-14 w-14 rounded-full border border-[var(--border)] object-cover shadow-[0_6px_18px_rgba(0,18,25,0.12)]"
              priority
            />
          </Link>

          {/* SearchBox 只掛載一次（跨斷點共用）：兩份實例會各掛一個 ⌘K 監聽、狀態互相打架 */}
          <div className="flex items-center gap-2 md:gap-5">
            <nav className="hidden items-center gap-5 text-sm text-[var(--muted)] md:flex">
              {links.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-3 py-2 md:px-2 md:py-1 transition-colors hover:bg-[var(--highlight)]/60 hover:text-[var(--accent)]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <SearchBox />
            <RssIcon />
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-sm text-[var(--foreground)] transition-colors hover:border-[var(--accent-strong)] md:hidden"
              aria-expanded={open}
              aria-label="Toggle navigation"
            >
              Menu
              <span aria-hidden className={`transition-transform ${open ? "rotate-90" : ""}`}>
                {open ? "x" : "|||"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {open ? (
        <div className="page-shell md:hidden">
          <div className="mb-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-[0_14px_34px_rgba(0,18,25,0.08)]">
            <div className="flex flex-col gap-2 text-sm text-[var(--foreground)]">
              {links.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-md px-3 py-2 transition-colors hover:bg-[var(--highlight)]/60 hover:text-[var(--accent)]"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {/* Search is now in the header bar next to Menu */}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
