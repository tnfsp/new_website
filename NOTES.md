# Project notes

- Stack: Next.js 16 (App Router) + TypeScript + Tailwind (sepia/murmur-inspired styling).
- Routes ready: /, /blog, /blog/[slug], /projects, /about, /links, /now, /murmur (redirect).
- Content placeholders: content/blog/*.json (3 sample posts), content/site/config.json (homepage copy), lib/placeholders.ts for fallbacks.
- Notion sync: scripts/sync-notion.ts reads Blog + SiteConfig DBs via env vars NOTION_TOKEN, NOTION_BLOG_DATABASE_ID, NOTION_SITE_CONFIG_DATABASE_ID and writes content/ JSON; missing env vars skip sync.
- Dev: npm install, then npm run dev (Turbopack). Lint/build: npm run lint / npm run build.

## Next tasks
1) Set env vars and run npm run sync:notion to pull real Notion data into content/.
2) Frontend: read content JSONs (with fallbacks), add shared layout/section components, refine spacing/RWD.
3) Deployment: pick Cloudflare Pages or Zeabur and document deploy steps/env vars.
4) Optional: add tests/lint rules and remove placeholder copy once Notion data is live.
