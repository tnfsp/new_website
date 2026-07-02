import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "edge";

const hasKV = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

// slug 含中文（如 週報索引），所以用 unicode letter/number + dash/underscore
const SLUG_RE = /^[\p{L}\p{N}_-]{1,80}$/u;

type Counts = { total: number };

const memoryStore: Map<string, Counts> =
  // @ts-expect-error keep in-memory counts across edge invocations
  globalThis.__LIKE_MEMORY__ ?? new Map<string, Counts>();
// @ts-expect-error attach back to global
globalThis.__LIKE_MEMORY__ = memoryStore;

async function getWithKV(slug: string): Promise<Counts> {
  const totalKey = `likes:${slug}:total`;
  const total = (await kv.get<number>(totalKey)) || 0;
  return { total };
}

async function incrementWithKV(slug: string): Promise<Counts> {
  const totalKey = `likes:${slug}:total`;
  const total = await kv.incr(totalKey);
  return { total };
}

function getInMemory(slug: string): Counts {
  const prev = memoryStore.get(slug) || { total: 0 };
  return prev;
}

function incrementInMemory(slug: string): Counts {
  const prev = memoryStore.get(slug) || { total: 0 };
  const next = { total: prev.total + 1 };
  memoryStore.set(slug, next);
  return next;
}

function validateSlug(request: Request): string | null {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug") || "home";
  return SLUG_RE.test(slug) ? slug : null;
}

export async function GET(request: Request) {
  const slug = validateSlug(request);
  if (!slug) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  try {
    const counts = hasKV ? await getWithKV(slug) : getInMemory(slug);
    return NextResponse.json(counts, { status: 200 });
  } catch (error) {
    console.error("[api/likes] Failed to read likes:", (error as Error).message);
    // 503 而不是假裝 total: 0——KV 短暫故障不該讓前端把真實數字歸零
    return NextResponse.json({ error: "Like store unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const slug = validateSlug(request);
  if (!slug) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  try {
    if (hasKV) {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
      const { allowed } = await rateLimit(`likes:${ip}`, {
        limit: 30,
        windowSeconds: 60,
      });
      if (!allowed) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
      }
    }

    const counts = hasKV ? await incrementWithKV(slug) : incrementInMemory(slug);
    return NextResponse.json(counts, { status: 200 });
  } catch (error) {
    console.error("[api/likes] Failed to record like:", (error as Error).message);
    return NextResponse.json({ error: "Like store unavailable" }, { status: 503 });
  }
}
