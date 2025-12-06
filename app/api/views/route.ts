import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export const runtime = "edge";

const hasKV = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

type Counts = { today: number; total: number };

const memoryStore: Map<string, Counts> =
  // @ts-ignore
  globalThis.__VIEW_MEMORY__ ?? new Map<string, Counts>();
// @ts-ignore
globalThis.__VIEW_MEMORY__ = memoryStore;

async function incrementWithKV(slug: string): Promise<Counts> {
  const today = new Date().toISOString().slice(0, 10);
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
  const today = new Date().toISOString().slice(0, 10);
  const key = `${slug}:${today}`;
  const prev = memoryStore.get(key) || { today: 0, total: 0 };
  const next = { today: prev.today + 1, total: prev.total + 1 };
  memoryStore.set(key, next);
  return next;
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug") || "home";

  try {
    const counts = hasKV ? await incrementWithKV(slug) : incrementInMemory(slug);
    return NextResponse.json(counts, { status: 200 });
  } catch (error) {
    console.error("[api/views] Failed to record view:", (error as Error).message);
    return NextResponse.json({ today: 0, total: 0 }, { status: 200 });
  }
}
