import { NextResponse } from "next/server";
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { todayInTaipei } from "@/lib/date";

const BLOG_DIR = join(process.cwd(), "content/blog");

export async function GET() {
  try {
    const files = await readdir(BLOG_DIR);
    const entries: { date: string; slug: string; title: string }[] = [];
    const today = todayInTaipei();

    for (const f of files) {
      if (!f.endsWith(".json")) continue;
      try {
        const raw = await readFile(join(BLOG_DIR, f), "utf-8");
        const data = JSON.parse(raw);
        // 草稿與排程中的文章不能提前曝光 slug（content pipeline 用
        // status: "Published"，不是 draft 欄位）
        if ((data.status || "Published") !== "Published") continue;
        if (data.publishedAt && String(data.publishedAt).slice(0, 10) > today) continue;
        if (data.publishedAt && data.slug) {
          entries.push({
            date: data.publishedAt,
            slug: data.slug,
            title: data.title || data.slug,
          });
        }
      } catch {
        // skip malformed files
      }
    }

    entries.sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ entries, total: entries.length }, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return NextResponse.json({ entries: [], total: 0 });
  }
}
