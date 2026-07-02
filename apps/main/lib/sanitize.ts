import sanitize from "sanitize-html";

/**
 * Sanitize HTML string to prevent XSS attacks.
 *
 * Content comes from our own pipelines (sync-vault / sync-notion / OWL)，
 * 但 /owl 是 AI 產出「不經編輯直接發布」，這裡是最後一道防線。
 *
 * 用 sanitize-html（htmlparser2-based）：不依賴 JSDOM，
 * 沒有 isomorphic-dompurify 在 Vercel serverless 上 500 的問題。
 * allowlist 對齊 sync 管線實際會產出的 tags（見 content/blog/*.json）。
 */
const OPTIONS: sanitize.IOptions = {
  allowedTags: [
    ...sanitize.defaults.allowedTags,
    "img",
    "figure",
    "figcaption",
    "del",
    "ins",
    "details",
    "summary",
  ],
  allowedAttributes: {
    ...sanitize.defaults.allowedAttributes,
    "*": ["class", "id"],
    a: ["href", "target", "rel", "title"],
    img: ["src", "alt", "title", "width", "height", "loading"],
  },
  // 只允許安全的 URL scheme（擋 javascript: 等）；站內相對路徑不受影響
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesAppliedToAttributes: ["href", "src"],
  allowProtocolRelative: false,
};

export function sanitizeHtml(dirty: string): string {
  return sanitize(dirty, OPTIONS);
}
