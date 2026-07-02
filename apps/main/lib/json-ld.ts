/**
 * JSON-LD 序列化 helper。
 *
 * JSON.stringify 的輸出若含有 `</script>`（例如文章標題或描述裡出現這串字），
 * 直接塞進 <script type="application/ld+json"> 會提早關閉標籤、破壞頁面。
 * 把 `<` 轉成 unicode escape（backslash-u003c）就能安全內嵌（JSON 解析結果不變）。
 */
export function jsonLdString(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}
