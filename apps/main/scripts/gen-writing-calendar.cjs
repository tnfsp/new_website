const fs = require("fs");
const path = require("path");

const BLOG_DIR = path.join(__dirname, "..", "content", "blog");
const OUT = path.join(__dirname, "..", "public", "writing-calendar.json");

const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".json"));
const entries = [];

// 台北日期（YYYY-MM-DD）——排程中的文章不能提前曝光
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei" }).format(new Date());

for (const f of files) {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(BLOG_DIR, f), "utf-8"));
    // content pipeline 用 status: "Published"，不是 draft 欄位
    if ((data.status || "Published") !== "Published") continue;
    if (data.publishedAt && String(data.publishedAt).slice(0, 10) > today) continue;
    if (data.publishedAt && data.slug) {
      entries.push({
        date: data.publishedAt,
        slug: data.slug,
        title: data.title || data.slug,
      });
    }
  } catch {}
}

entries.sort((a, b) => a.date.localeCompare(b.date));
fs.writeFileSync(OUT, JSON.stringify({ entries, total: entries.length }));
console.log(`[gen-writing-calendar] ${entries.length} entries`);
