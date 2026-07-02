import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { escapeHtml } from "@/lib/escape-html";
import { notifyOwnerEmail } from "@/lib/notify";
import { pushToKvList } from "@/lib/kv-list";

/**
 * 抽屜「簽到本」——私密版。
 *
 * 訪客留言「只進 Wilson 信箱、不公開」(見交班決策)：
 *  - 存進 KV 當備份（key: drawer:notes），但沒有公開 GET。
 *  - 主要投遞是 Email 通知 Wilson 本人（Resend，沿用站上既有設定）。
 * 沿用站上 comments/subscribe 的防護：rateLimit + honeypot + escapeHtml。
 */

type DrawerNote = {
  id: string;
  name?: string;
  message: string;
  question?: string; // 訪客當時在看哪張碎片（脈絡用）
  createdAt: string;
};

const KV_KEY = "drawer:notes";
const MAX_MESSAGE = 2000;
const MAX_NAME = 50;
const MAX_QUESTION = 200;

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed } = await rateLimit(`drawer-note:${ip}`, {
      limit: 3,
      windowSeconds: 60,
    });
    if (!allowed) {
      return NextResponse.json(
        { error: "留言太頻繁了，稍等一下再試。" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, message, question, honeypot } = body ?? {};

    // Honeypot：被填了就當 spam，假裝成功但不存。
    if (honeypot) {
      return NextResponse.json({ success: true });
    }

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "想跟我說點什麼呢？" }, { status: 400 });
    }
    if (message.length > MAX_MESSAGE) {
      return NextResponse.json(
        { error: `留言太長了（上限 ${MAX_MESSAGE} 字）` },
        { status: 400 }
      );
    }

    const note: DrawerNote = {
      id: nanoid(),
      ...(name && typeof name === "string" && name.trim()
        ? { name: escapeHtml(name.trim().slice(0, MAX_NAME)) }
        : {}),
      message: escapeHtml(message.trim()),
      ...(question && typeof question === "string" && question.trim()
        ? { question: escapeHtml(question.trim().slice(0, MAX_QUESTION)) }
        : {}),
      createdAt: new Date().toISOString(),
    };

    // 存 KV 當備份（best-effort——KV 掛了也別讓留言整個丟掉，靠 Telegram 補）。
    // Redis list：lpush 原子 append，兩個人同時留言不會互相蓋掉。
    let stored = false;
    try {
      await pushToKvList(KV_KEY, note, 1000);
      stored = true;
    } catch (err) {
      console.error("[drawer-note] KV 儲存失敗:", err);
    }

    // 通知 Wilson 本人（私密投遞的主管道）。
    // note.* 都已 escapeHtml，可安全嵌進 email HTML。
    const emailHtml = `
      <div style="font-family:-apple-system,'Noto Sans TC',sans-serif;max-width:560px;margin:0 auto;padding:24px 16px;background-color:#f8f4ea;color:#001219;line-height:1.8;">
        <p style="margin:0 0 4px;font-weight:600;">有人留了話給你</p>
        <p style="margin:0 0 16px;color:#00505f;font-size:13px;">
          來自：${note.name || "（匿名）"}${
            note.question ? `<br/>在這張碎片旁：${note.question}` : ""
          }
        </p>
        <div style="white-space:pre-wrap;border-left:2px solid #ca6702;padding-left:12px;">${note.message}</div>
      </div>`;
    const notified = await notifyOwnerEmail("有人留了話給你", emailHtml);

    // 兩條路都失敗才算真的失敗（留言會遺失）。
    if (!stored && !notified) {
      return NextResponse.json(
        { error: "留言沒送出去，再試一次？" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[drawer-note] POST 失敗:", error);
    return NextResponse.json({ error: "出了點問題，再試一次？" }, { status: 500 });
  }
}
