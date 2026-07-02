import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";
import { kvListLength } from "@/lib/kv-list";

/**
 * 站方私用的統計面板 API。
 *
 * 需要 `Authorization: Bearer ${STATS_SECRET}`——這個端點會全掃 KV
 * （keys + mget），公開的話等於讓任何人幫你灌 Upstash 帳單，
 * 還會洩漏訂閱數與流量。STATS_SECRET 沒設就一律 401（fail closed）。
 */

type ArticleStats = {
  slug: string;
  views: number;
  likes?: number;
  comments?: number;
};

type SubscriberMeta = {
  subscribedAt: string;
  source: string;
};

type DailyViews = {
  date: string;
  views: number;
};

/** mget 一批 key；空陣列直接回空，避免 mget() 無參數報錯。 */
async function batchGet<T>(keys: string[]): Promise<(T | null)[]> {
  if (keys.length === 0) return [];
  return kv.mget<(T | null)[]>(...keys);
}

export async function GET(request: NextRequest) {
  const secret = process.env.STATS_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json(
      { error: secret ? "Unauthorized" : "STATS_SECRET is not configured" },
      { status: 401 }
    );
  }

  try {
    // === 1. Views Data ===
    const viewKeys = await kv.keys("views:*:total");
    const viewValues = await batchGet<number>(viewKeys);
    const articleStats: Map<string, ArticleStats> = new Map();

    viewKeys.forEach((key, i) => {
      const views = viewValues[i];
      const slug = key.replace("views:", "").replace(":total", "");
      if (views && slug !== "home") {
        articleStats.set(slug, { slug, views, likes: 0, comments: 0 });
      }
    });

    // === 2. Likes Data (按讚排行) ===
    const likeKeys = await kv.keys("likes:*:total");
    const likeValues = await batchGet<number>(likeKeys);
    const likesData: { slug: string; likes: number }[] = [];

    likeKeys.forEach((key, i) => {
      const likes = likeValues[i];
      const slug = key.replace("likes:", "").replace(":total", "");
      if (likes) {
        likesData.push({ slug, likes });
        const existing = articleStats.get(slug);
        if (existing) {
          existing.likes = likes;
        }
      }
    });
    likesData.sort((a, b) => b.likes - a.likes);

    // === 3. Comments per Article (留言活躍度) ===
    // 留言已遷移成 Redis list，長度用 kvListLength（相容新舊格式）
    const commentKeys = await kv.keys("comments:*:list");
    const commentCounts = await Promise.all(
      commentKeys.map((key) => kvListLength(key))
    );
    const commentsData: { slug: string; comments: number }[] = [];
    let totalComments = 0;

    commentKeys.forEach((key, i) => {
      const count = commentCounts[i];
      const slug = key.replace("comments:", "").replace(":list", "");
      if (count > 0) {
        commentsData.push({ slug, comments: count });
        totalComments += count;
        const existing = articleStats.get(slug);
        if (existing) {
          existing.comments = count;
        }
      }
    });
    commentsData.sort((a, b) => b.comments - a.comments);

    // === 4. Daily Views Trend (流量趨勢) ===
    const dailyKeys = await kv.keys("views:*:today:*");
    const dailyValues = await batchGet<number>(dailyKeys);
    const dailyMap: Map<string, number> = new Map();

    dailyKeys.forEach((key, i) => {
      const views = dailyValues[i];
      // Extract date from key like "views:home:today:2026-01-15"
      const dateMatch = key.match(/today:(\d{4}-\d{2}-\d{2})$/);
      if (views && dateMatch) {
        const date = dateMatch[1];
        dailyMap.set(date, (dailyMap.get(date) || 0) + views);
      }
    });

    const dailyTrend: DailyViews[] = Array.from(dailyMap.entries())
      .map(([date, views]) => ({ date, views }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // === 5. Subscriber Sources (訂閱來源) ===
    const subscribers = await kv.smembers("subscribers:emails");
    const metaValues = await batchGet<SubscriberMeta>(
      subscribers.map((email) => `subscribers:${email}:meta`)
    );
    const sourceMap: Map<string, number> = new Map();

    for (const meta of metaValues) {
      if (meta?.source) {
        sourceMap.set(meta.source, (sourceMap.get(meta.source) || 0) + 1);
      }
    }

    const subscriberSources = Array.from(sourceMap.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);

    // === 6. Home & Total Views ===
    const homeViews = (await kv.get<number>("views:home:total")) || 0;
    const allArticles = Array.from(articleStats.values())
      .sort((a, b) => b.views - a.views);
    const totalViews = allArticles.reduce((sum, item) => sum + item.views, 0) + homeViews;

    // === 7. Total Likes ===
    const totalLikes = likesData.reduce((sum, item) => sum + item.likes, 0);

    return NextResponse.json({
      // 總覽
      summary: {
        totalViews,
        homeViews,
        totalLikes,
        subscriberCount: subscribers.length,
        totalComments,
        articleCount: allArticles.length,
      },
      // 熱門文章（含瀏覽、按讚、留言）
      topArticles: allArticles.slice(0, 10),
      // 按讚排行
      topLiked: likesData.slice(0, 10),
      // 留言活躍度
      mostDiscussed: commentsData.slice(0, 10),
      // 流量趨勢（近期每日）
      dailyTrend,
      // 訂閱來源分析
      subscriberSources,
      // 完整數據
      allArticles,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
