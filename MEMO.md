# MEMO

Open items / reminders
- Fill real copy in Notion SiteConfig (hero/murmur/about/footer, Blog/Projects titles, AboutImage) and rerun `npm run sync:notion`.
- Ensure Notion Blog/Daily (Projects DB) have Type filled for filters; set Published status + dates; slug values unique.
- Set `NEXT_PUBLIC_SITE_URL` to production domain so `/feed.xml` emits correct absolute links.
- Decide if `/projects` should redirect to `/daily` for backward compatibility (currently navbar uses `/daily`).
- Provide stable images (store in `public/` or via Notion sync) for AboutImage/Daily entries; SiteConfig image download is not implemented.
- Source map warnings appear from Turbopack in dev; non-blocking but can be revisited if they persist in production logs.
