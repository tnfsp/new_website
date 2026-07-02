import { BASE_URL } from "@/lib/constants";

export function GET() {
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "",
    `Sitemap: ${BASE_URL}/sitemap.xml`,
    `LLMs-Txt: ${BASE_URL}/llms.txt`,
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
