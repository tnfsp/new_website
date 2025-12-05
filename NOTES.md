# Project notes

- Stack: Next.js 16 (App Router) + TypeScript + Tailwind (sepia/murmur-inspired styling).
- Routes ready: /, /blog, /blog/[slug], /projects, /about, /links, /now, /murmur (redirect).
- Content placeholders: content/blog/*.json (3 sample posts), content/site/config.json (homepage copy), lib/placeholders.ts for fallbacks.
- Notion sync: scripts/sync-notion.ts reads Blog + SiteConfig DBs via env vars NOTION_TOKEN, NOTION_BLOG_DATABASE_ID, NOTION_SITE_CONFIG_DATABASE_ID and writes content/ JSON; missing env vars skip sync.
- Dev: npm install, then npm run dev (Turbopack). Lint/build: npm run lint / npm run build.

## Next tasks
1) Add project link in Notion for "Published" item if needed; ensure it starts with "/" or "http" and rerun npm run sync:notion.
2) Fill real copy in Notion SiteConfig (hero/about/footer) and resync to replace placeholder numbers.
3) Start npm run dev when reviewing locally (stopped after cleanup); verify /projects, /blog/[slug] navigation.
4) Keep README changelog updated for future changes per workflow agreement.
