import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "*": ["./content/**/*"],
  },
  async redirects() {
    return [
      // Teaching subdomain — see apps/teaching (teaching.wilsonchao.com).
      // 1:1 path preservation lets external links keep working.
      { source: "/teaching", destination: "https://teaching.wilsonchao.com/teaching", permanent: true },
      { source: "/teaching/:path*", destination: "https://teaching.wilsonchao.com/teaching/:path*", permanent: true },
      { source: "/clerk", destination: "https://teaching.wilsonchao.com/clerk", permanent: true },
      { source: "/clerk/:path*", destination: "https://teaching.wilsonchao.com/clerk/:path*", permanent: true },

      { source: "/blog/fomo-anxiety", destination: "/blog/fomo-anxiety-2026-q1", permanent: true },

      // /daily and /projects → /blog
      { source: "/daily", destination: "/blog", permanent: true },
      { source: "/daily/:slug*", destination: "/blog/:slug*", permanent: true },
      { source: "/projects", destination: "/blog", permanent: true },
      { source: "/projects/:slug*", destination: "/blog/:slug*", permanent: true },

      // /murmur → /stream
      { source: "/murmur", destination: "/stream", permanent: false },

      // Journal → Blog redirects
      // 注意：Next redirects 是 first-match-wins，這條 catch-all 會先吃掉所有
      // /journal/* 流量。舊 UUID 走兩跳：/journal/UUID → /blog/UUID →（下方
      // /blog/UUID 規則）→ /blog/new-slug。不要在這條後面再加 /journal/UUID
      // 的特定規則——永遠不會被匹配到。
      { source: "/journal", destination: "/blog", permanent: true },
      { source: "/journal/:slug*", destination: "/blog/:slug*", permanent: true },

      // /blog/UUID → /blog/new-slug (for direct blog access with old UUIDs)
      { source: "/blog/2c0bd17b-5bf9-81b0-aa17-cd509c14f0b0", destination: "/blog/writing-ability-decline", permanent: true },
      { source: "/blog/2c0bd17b-5bf9-8126-9ddc-c5a0b3d506af", destination: "/blog/dulan-trip-indigenous", permanent: true },
      { source: "/blog/2c0bd17b-5bf9-8132-995a-e015e90ea3c4", destination: "/blog/flash-trip-taipei", permanent: true },
      { source: "/blog/2c0bd17b-5bf9-81af-a79f-ff4bfca6c197", destination: "/blog/start-journaling", permanent: true },
      { source: "/blog/2c0bd17b-5bf9-813e-b55e-e470a70ad321", destination: "/blog/kfc-memory", permanent: true },
      { source: "/blog/2c0bd17b-5bf9-815b-8cea-c5571963da36", destination: "/blog/taitung-trip", permanent: true },
      { source: "/blog/2c0bd17b-5bf9-811d-b80d-fa11a78bec10", destination: "/blog/curated-life", permanent: true },
      { source: "/blog/2c0bd17b-5bf9-81ad-b0fb-eca73d2e43a6", destination: "/blog/cardiac-surgery-dinner", permanent: true },
      { source: "/blog/2c0bd17b-5bf9-8122-a5bc-c1bb19b635df", destination: "/blog/fear-of-writing", permanent: true },
      { source: "/blog/2c0bd17b-5bf9-8137-8b3c-f9ff31ac41e7", destination: "/blog/jasmine-bloomed", permanent: true },
      { source: "/blog/2c0bd17b-5bf9-8170-a9af-ffcc372c5af6", destination: "/blog/busy-day", permanent: true },
      { source: "/blog/2c0bd17b-5bf9-81b6-bdbb-d99820b35c60", destination: "/blog/recharge-happiness", permanent: true },
      { source: "/blog/2c0bd17b-5bf9-81a4-8580-e9084a8602df", destination: "/blog/on-call-log", permanent: true },
      { source: "/blog/2c0bd17b-5bf9-8109-ad8f-ea45016ca965", destination: "/blog/working-late-every-day", permanent: true },
      { source: "/blog/2c0bd17b-5bf9-8159-93ff-e9a81f7d53e4", destination: "/blog/bleeding-nonstop", permanent: true },
      { source: "/blog/2c0bd17b-5bf9-811d-9858-e1dfde1520b5", destination: "/blog/four-valve-replacements", permanent: true },
      { source: "/blog/2c0bd17b-5bf9-81c8-9f71-dac43cbd7588", destination: "/blog/october-sky", permanent: true },
      { source: "/blog/2c0bd17b-5bf9-8183-bae0-fa5dd40c2443", destination: "/blog/roasted-by-freedom", permanent: true },
      { source: "/blog/2c0bd17b-5bf9-817a-a9fd-f35d159e5bd9", destination: "/blog/worst-day-ever", permanent: true },
      { source: "/blog/2c0bd17b-5bf9-8110-a69f-d8877af647f4", destination: "/blog/too-exhausted", permanent: true },
      { source: "/blog/2c0bd17b-5bf9-815e-9119-db38cbe92515", destination: "/blog/going-home", permanent: true },
      { source: "/blog/2c0bd17b-5bf9-81d3-aacd-dc38bf90609c", destination: "/blog/slow-is-smooth", permanent: true },
      { source: "/blog/2c0bd17b-5bf9-8129-af13-ef1b4f6f4920", destination: "/blog/long-distance-begins", permanent: true },
      { source: "/blog/2c0bd17b-5bf9-81de-abe1-e13c5c4d576b", destination: "/blog/leaving-on-time", permanent: true },
      { source: "/blog/2c0bd17b-5bf9-8178-8c86-e61896d39c0c", destination: "/blog/time-to-pray", permanent: true },
      { source: "/blog/2c0bd17b-5bf9-8127-af6b-f24a99490241", destination: "/blog/day-off", permanent: true },
      { source: "/blog/2c0bd17b-5bf9-819e-aef8-e4ffeea03c89", destination: "/blog/heart-transplant", permanent: true },
      { source: "/blog/2c0bd17b-5bf9-8173-bbcf-cfb379dd12c2", destination: "/blog/post-youth", permanent: true },
      { source: "/blog/2c0bd17b-5bf9-8114-b558-e5bdf864c534", destination: "/blog/full-moon", permanent: true },
      { source: "/blog/2ccbd17b-5bf9-8069-a6ce-c4db0060de2a", destination: "/blog/recent-poems", permanent: true },
    ];
  },
};

export default nextConfig;
