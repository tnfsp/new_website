import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { rateLimit } from "@/lib/rate-limit";
import { todayInTaipei } from "@/lib/date";

export const runtime = "edge";

const hasKV = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

// slug 含中文（如 週報索引），所以用 unicode letter/number + dash/underscore
const SLUG_RE = /^[\p{L}\p{N}_-]{1,80}$/u;

type Counts = { today: number; total: number };

const memoryStore: Map<string, Counts> =
  // @ts-expect-error store on global for in-memory fallback across requests
  globalThis.__VIEW_MEMORY__ ?? new Map<string, Counts>();
// @ts-expect-error same as above
globalThis.__VIEW_MEMORY__ = memoryStore;

async function incrementWithKV(slug: string): Promise<Counts> {
  const today = todayInTaipei();
  const totalKey = `views:${slug}:total`;
  const todayKey = `views:${slug}:today:${today}`;

  // Run in parallel; keep a short expiry for the rolling "today" bucket.
  const [total, todayCount] = await Promise.all([
    kv.incr(totalKey),
    kv.incr(todayKey).then(async (value) => {
      await kv.expire(todayKey, 3 * 24 * 60 * 60); // keep 3 days
      return value;
    }),
  ]);

  return { today: todayCount, total };
}

function incrementInMemory(slug: string): Counts {
  const today = todayInTaipei();
  const key = `${slug}:${today}`;
  const prev = memoryStore.get(key) || { today: 0, total: 0 };
  const next = { today: prev.today + 1, total: prev.total + 1 };
  memoryStore.set(key, next);
  return next;
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug") || "home";
  if (!SLUG_RE.test(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  try {
    if (hasKV) {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
      const { allowed } = await rateLimit(`views:${ip}`, {
        limit: 60,
        windowSeconds: 60,
      });
      if (!allowed) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
      }
    }

    const counts = hasKV ? await incrementWithKV(slug) : incrementInMemory(slug);
    return NextResponse.json(counts, { status: 200 });
  } catch (error) {
    console.error("[api/views] Failed to record view:", (error as Error).message);
    // 503 而不是假裝 0——KV 短暫故障不該讓前端顯示歸零的數字
    return NextResponse.json({ error: "View store unavailable" }, { status: 503 });
  }
}
