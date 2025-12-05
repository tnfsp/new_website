import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "wilsonchao.com",
  description: "The home for Yi-Hsiang Chao, MD — surgery, writing, and slow thinking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className="page-shell flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-3" aria-label="Go to homepage">
            <Image
              src="/avatar.png"
              alt="Yi-Hsiang Chao portrait"
              width={56}
              height={56}
              className="h-14 w-14 rounded-full border border-[var(--border)] object-cover shadow-[0_6px_18px_rgba(0,0,0,0.08)]"
              priority
            />
          </Link>
          <nav className="flex items-center gap-5 text-sm text-[var(--muted)]">
            <Link href="/" className="hover:text-[var(--accent)]">
              Home
            </Link>
            <Link href="/blog" className="hover:text-[var(--accent)]">
              Blog
            </Link>
            <Link href="/murmur" className="hover:text-[var(--accent)]">
              Murmur
            </Link>
            <Link href="/daily" className="hover:text-[var(--accent)]">
              Daily
            </Link>
            <Link href="/about" className="hover:text-[var(--accent)]">
              About
            </Link>
            <Link href="/links" className="hover:text-[var(--accent)]">
              Links
            </Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
