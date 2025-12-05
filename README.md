# wilsonchao.com

Next.js (App Router) + TypeScript + Tailwind skeleton for Dr. Yi-Hsiang Chao’s site. The layout follows the quiet, sepia-inspired look of murmur.wilsonchao.com: narrow column, soft borders, text-first.

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
   - Env vars required: `NOTION_TOKEN`, `NOTION_BLOG_DATABASE_ID`, `NOTION_SITE_CONFIG_DATABASE_ID`
   - Writes to `content/blog/*.json` and `content/site/config.json`; missing env vars will skip sync gracefully.
   - Script runs with `node --no-deprecation --import ./scripts/register-ts-node.mjs` to avoid noisy deprecation/experimental warnings.

## Project structure
- `app/` – App Router pages (`/`, `/blog`, `/blog/[slug]`, `/projects`, `/about`, `/links`, `/now`, `/murmur` redirect).
- `components/` – layout/sections/ui folders ready for shared components.
- `content/` – placeholder JSON:
  - `content/blog/*.json` – Blog entries (Notion export target).
  - `content/site/config.json` – Homepage copy from SiteConfig DB.
- `lib/placeholders.ts` – Temporary data + fallbacks until Notion sync is live.
- `public/` – static assets.
- `scripts/sync-notion.ts` – Syncs Blog + SiteConfig from Notion into `content/` (markdown + HTML + reading time).

## Notes
- `/murmur` redirects to `https://murmur.wilsonchao.com` (murmur stays a separate project).
- SiteConfig keys missing in `content/site/config.json` should fall back to defaults; the build should not fail because of missing copy.
- Pages read from `content/` JSON; if files are absent or empty, placeholders are used (see `lib/content.ts` + `lib/placeholders.ts`).
- Tailwind is kept minimal to match murmur’s text-first aesthetic; avoid heavy UI kits per `AGENTS.md`.
- Blog detail pages now render Notion-exported HTML (with a plain-text fallback) and show estimated reading time.
- Automation: `.github/workflows/sync-and-deploy.yml` runs daily (02:30 UTC) or manually; it installs deps, runs `npm run sync:notion` with repo secrets, and then hits a deploy hook. Set one of `VERCEL_DEPLOY_HOOK_URL` or `CF_PAGES_DEPLOY_HOOK_URL`.

## Changelog

- 2025-12-05: Added /projects/[slug] detail page with Notion-synced data; fixed blog params for React 19/Next 16; validated project hrefs; added `.env.local.example`; refreshed homepage copy; synced latest Notion content (blog/site/projects).
- 2025-12-05: Fixed blog dynamic params for React 19/Next 16, added `.env.local.example`, validated project hrefs (skip invalid links), pulled latest Notion content (blog, site copy, projects), and refreshed homepage copy.

### Vercel deploy tips
- Build command: `npm run sync:notion && npm run build` (so Notion data is pulled during build).
- Set env vars in Vercel: `NOTION_TOKEN`, `NOTION_BLOG_DATABASE_ID`, `NOTION_SITE_CONFIG_DATABASE_ID` (and optionally `NODE_VERSION=20`).
- To auto-refresh from Notion, create a Vercel deploy hook and set `VERCEL_DEPLOY_HOOK_URL` as a GitHub secret; the scheduled workflow will call it nightly.
- About page can optionally read from a blog entry with `Type=About` (uses Notion contentHtml fallback if present).
- Projects can sync from Notion if `NOTION_PROJECTS_DATABASE_ID` is provided; otherwise it reads `content/projects.json`.
