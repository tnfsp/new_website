import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { escapeHtml } from "@/lib/escape-html";
import { readKvList, pushToKvList } from "@/lib/kv-list";

type Comment = {
  id: string;
  slug: string;
  name: string;
  email?: string;
  content: string;
  createdAt: string;
};

/** email 只存給 Wilson 回信用，永遠不對外回傳。 */
type PublicComment = Omit<Comment, "email">;

function toPublicComment(comment: Comment): PublicComment {
  const publicComment = { ...comment };
  delete publicComment.email;
  return publicComment;
}

function getCommentsKey(slug: string): string {
  return `comments:${slug}:list`;
}

// 單篇文章留言上限——防止有人在 rate limit 內慢慢灌爆單一 key
const MAX_COMMENTS_PER_SLUG = 500;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  try {
    const comments = await readKvList<Comment>(getCommentsKey(slug));
    return NextResponse.json({ comments: comments.map(toPublicComment) });
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed, remaining } = await rateLimit(`comments:${ip}`, {
      limit: 5,
      windowSeconds: 60,
    });

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many comments. Please wait a moment." },
        {
          status: 429,
          headers: { "X-RateLimit-Remaining": remaining.toString() },
        }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const { slug, name, email, content, honeypot } = body ?? {};

    // Honeypot check - if filled, it's likely spam
    if (honeypot) {
      // Silently accept but don't save
      return NextResponse.json({ success: true });
    }

    if (!slug || typeof slug !== "string" || !/^[a-z0-9-]+$/i.test(slug)) {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: "content too long (max 2000 chars)" }, { status: 400 });
    }

    if (email && (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim()))) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const comment: Comment = {
      id: nanoid(),
      slug,
      name: escapeHtml(name.trim().slice(0, 50)),
      email: email ? (email as string).trim().slice(0, 100) : undefined,
      content: escapeHtml(content.trim()),
      createdAt: new Date().toISOString(),
    };

    // Redis list：lpush 原子 append（newest first），不會有並發蓋寫
    await pushToKvList(getCommentsKey(slug), comment, MAX_COMMENTS_PER_SLUG);

    return NextResponse.json(
      { comment: toPublicComment(comment), success: true },
      { status: 201 }
    );
  } catch (error) {
    console.error("Post comment error:", error);
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }
}
