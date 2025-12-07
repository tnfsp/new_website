# wilsonchao.com

Next.js (App Router) + TypeScript + Tailwind site for Dr. Yi-Hsiang Chao. Visual style follows murmur.wilsonchao.com: narrow column, soft borders, text-first.

## Stack
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS (v4, inline theme)
- npm

## Getting started
1. Install dependencies: `npm install`
2. Run dev server: `npm run dev`
3. Lint: `npm run lint`
4. Build: `npm run build`
5. Sync Notion content: `npm run sync:notion`
   - Env vars: `NOTION_TOKEN`, `NOTION_BLOG_DATABASE_ID`, `NOTION_SITE_CONFIG_DATABASE_ID`, optional `NOTION_PROJECTS_DATABASE_ID`
   - Writes to `content/blog/*.json`, `content/site/config.json`, `content/projects.json`; missing env vars skip sync gracefully.
   - Runs with `node --no-deprecation --import ./scripts/register-ts-node.mjs`.

## Project structure
- `app/` – pages (`/`, `/blog`, `/blog/[slug]`, `/daily`, `/daily/[slug]`, `/about`, `/links`, `/now`, `/murmur` redirect, `/feed.xml`, `/daily/feed.xml`).
- `components/` – layout/sections/ui.
- `content/` – JSON data:
  - `content/blog/*.json` – Blog entries (from Notion).
  - `content/site/config.json` – Site copy from SiteConfig DB.
  - `content/projects.json` – Daily entries (from Notion projects DB).
- `lib/placeholders.ts` – fallbacks.
- `public/` – static assets + synced images under `public/content/...`.
- `scripts/sync-notion.ts` – Syncs blog/site config/projects; downloads images for blog + projects.

## Notes
- Missing SiteConfig keys fall back to defaults (build won’t fail).
- Pages read from `content/`; placeholders used if files absent.
- Tailwind kept minimal to match murmur aesthetic; avoid heavy UI kits.
- Blog detail renders Notion HTML (with plain-text fallback) and shows reading time; filtering uses `?type=`.
- Daily lives under `/daily`; type filter supported; prev/next navigation on entries.
- Murmur preview pulls `MURMUR_FEED_URL` (default `https://murmur.wilsonchao.com/rss.json`), highlights snippet in yellow; `/murmur` redirects out.
- RSS: combined blog + daily at `/feed.xml` (alias `/feed`); legacy daily-only feed remains at `/daily/feed.xml` (alias `/daily/feed`); set `NEXT_PUBLIC_SITE_URL` for absolute links.
- Comments: giscus embed (set `NEXT_PUBLIC_GISCUS_*`; renders only when IDs are provided). Defaults: mapping pathname, theme `preferred_color_scheme`, lang `zh-TW`, strict `0`; override via env if needed.
- Subscribe: Buttondown link added to Links page (`NEXT_PUBLIC_BUTTONDOWN_URL`).
- CI: `.github/workflows/sync-and-deploy.yml` runs daily (02:30 UTC) or manual; runs sync + deploy hook (set `VERCEL_DEPLOY_HOOK_URL` or `CF_PAGES_DEPLOY_HOOK_URL`).

## Changelog
- 2025-12-06: Added Daily route (/daily), type filters, prev/next for Daily & Blog, murmur preview with feed parsing and yellow highlight, image sync for projects/blog, navbar updates.
