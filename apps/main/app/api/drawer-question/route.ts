import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { escapeHtml } from "@/lib/escape-html";
import { notifyOwnerEmail } from "@/lib/notify";
import { pushToKvList } from "@/lib/kv-list";

/**
 * 抽屜「丟一張紙條」——訪客出題。
 *
 * 訪客寫下想問 Wilson 的一題 → 進 KV 排隊（key: drawer:questions）→ Owl 之後從
 * 這裡撈題，當每天問 Wilson 的素材。同時 Email 通知 Wilson 本人，先有可見性。
 *
 * 防護沿用站上其它表單：rateLimit + honeypot + escapeHtml。
 *
 * TODO（資料合約，待跟 OWL 對）：Owl 在本機，要讀到 Vercel KV 裡的 drawer:questions——
 * 給 Owl 一組 KV 唯讀 token，或開一個受保護的 GET endpoint 讓 Owl 拉。
 */

type DrawerQuestion = {
  id: string;
  question: string;
  from?: string;
  createdAt: string;
  asked: boolean; // Owl 撈去問過了沒（之後 Owl 回寫）
};

const KV_KEY = "drawer:questions";
const MAX_QUESTION = 500;
const MAX_FROM = 50;

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed } = await rateLimit(`drawer-question:${ip}`, {
      limit: 3,
      windowSeconds: 60,
    });
    if (!allowed) {
      return NextResponse.json(
        { error: "丟太快了，稍等一下再試。" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { question, from, honeypot } = body ?? {};

    if (honeypot) {
      return NextResponse.json({ success: true });
    }

    if (
      !question ||
      typeof question !== "string" ||
      question.trim().length === 0
    ) {
      return NextResponse.json({ error: "想問我什麼呢？" }, { status: 400 });
    }
    if (question.length > MAX_QUESTION) {
      return NextResponse.json(
        { error: `問題太長了（上限 ${MAX_QUESTION} 字）` },
        { status: 400 }
      );
    }

    const item: DrawerQuestion = {
      id: nanoid(),
      question: escapeHtml(question.trim()),
      ...(from && typeof from === "string" && from.trim()
        ? { from: escapeHtml(from.trim().slice(0, MAX_FROM)) }
        : {}),
      createdAt: new Date().toISOString(),
      asked: false,
    };

    // 進 KV 排隊（best-effort）——Owl 之後從這撈。
    // Redis list：lpush 原子 append，兩張紙條同時丟進來不會互相蓋掉。
    // （給 OWL 的讀取合約：LRANGE drawer:questions 0 -1，newest first）
    let stored = false;
    try {
      await pushToKvList(KV_KEY, item, 1000);
      stored = true;
    } catch (err) {
      console.error("[drawer-question] KV 儲存失敗:", err);
    }

    // Email 通知 Wilson（即時可見性；Owl 撈題是另一條）。
    const html = `
      <div style="font-family:-apple-system,'Noto Sans TC',sans-serif;max-width:560px;margin:0 auto;padding:24px 16px;background-color:#f8f4ea;color:#001219;line-height:1.8;">
        <p style="margin:0 0 4px;font-weight:600;">有人丟了一張紙條給你</p>
        <p style="margin:0 0 16px;color:#00505f;font-size:13px;">來自：${item.from || "（匿名）"}</p>
        <div style="white-space:pre-wrap;border-left:2px solid #ca6702;padding-left:12px;">${item.question}</div>
        <p style="margin:16px 0 0;color:#00505f;font-size:12px;">Owl 之後會從抽屜題庫撈這題來問你。</p>
      </div>`;
    const notified = await notifyOwnerEmail("有人丟了一張紙條給你", html);

    if (!stored && !notified) {
      return NextResponse.json(
        { error: "紙條沒丟進去，再試一次？" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[drawer-question] POST 失敗:", error);
    return NextResponse.json({ error: "出了點問題，再試一次？" }, { status: 500 });
  }
}
