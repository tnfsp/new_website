import { kv } from "@vercel/kv";
import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { escapeHtml } from "@/lib/escape-html";
import { rateLimit } from "@/lib/rate-limit";

const SUBSCRIBERS_KEY = "subscribers:emails";
const SITE_URL = "https://wilsonchao.com";

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

type FeaturedEntry = {
  slug: string;
  title: string;
  note?: string;
};

// 精選清單由 Phase 2 的 content/site/featured.json 提供；
// 檔案還不存在時，歡迎信會自動省略這個區塊。
async function loadFeatured(): Promise<FeaturedEntry[]> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "content", "site", "featured.json"),
      "utf8"
    );
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data
      .filter((e) => e && typeof e.slug === "string" && typeof e.title === "string")
      .slice(0, 3);
  } catch {
    return [];
  }
}

// 文案是 Wilson 親筆（2026-06-12 定稿），改動前先給他過目
function welcomeEmailHtml(featured: FeaturedEntry[]): string {
  const featuredBlock =
    featured.length > 0
      ? `
      <p style="color:#001219;line-height:1.9;">
        如果想先逛逛，這${featured.length === 3 ? "三" : "幾"}篇是我自己會想拿給朋友看的：<br/>
        ${featured
          .map(
            (e) =>
              `・<a href="${SITE_URL}/blog/${encodeURIComponent(e.slug)}" style="color:#ca6702;">${escapeHtml(e.title)}</a>`
          )
          .join("<br/>\n        ")}
      </p>`
      : "";

  return `
    <div style="font-family:'Noto Sans TC',-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px 16px;background-color:#f8f4ea;">
      <p style="color:#001219;line-height:1.9;">嗨，我是玴祥。</p>
      <p style="color:#001219;line-height:1.9;">
        謝謝你留下 email！<br/>
        知道有人在讀我寫的文字，真是一種奇妙的感覺！
      </p>
      <p style="color:#001219;line-height:1.9;">
        之後每個禮拜，我會把當週的週報寄到這裡，或者不定時發一些給老朋友的信。<br/>
        但有時過多的承諾，反而會讓我壓力很大，進而導致拖延 XD
      </p>
      <p style="color:#001219;line-height:1.9;">總之我會試著寫寫看的～</p>
      ${featuredBlock}
      <p style="color:#001219;line-height:1.9;">
        其實我一直很好奇：你是讀到哪一篇，才決定留下 email 的？<br/>
        如果有空，可以回信跟我聊聊～
      </p>
      <p style="color:#001219;line-height:1.9;">玴祥</p>
      <hr style="border:none;border-top:1px solid rgba(0,18,25,0.14);margin:32px 0 16px;" />
      <p style="color:#00505f;font-size:12px;line-height:1.8;">
        你會收到這封信，是因為你在 <a href="${SITE_URL}" style="color:#00505f;">wilsonchao.com</a> 訂閱了週報。
      </p>
    </div>
  `;
}

async function addToResend(email: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set — subscriber stored in KV only.");
    return;
  }

  const resend = new Resend(apiKey);
  const segmentId = process.env.RESEND_SEGMENT_ID;

  // Resend 為寄送名單的 source of truth；KV 僅作歷史紀錄
  // 注意：Resend SDK 不 throw，錯誤在回傳值裡，必須逐一檢查
  const contact = await resend.contacts.create({
    email,
    unsubscribed: false,
    ...(segmentId ? { segments: [{ id: segmentId }] } : {}),
  });
  if (contact.error) {
    // contact 沒進寄送名單就是訂閱失敗，必須 throw 讓 caller rollback KV，
    // 否則 email 卡在 KV 擋住重訂、卻永遠收不到週報（訂閱黑洞）
    throw new Error(`Resend contacts.create failed: ${contact.error.message}`);
  }

  // 歡迎信失敗不算訂閱失敗——contact 已在名單裡，之後可補寄
  try {
    const featured = await loadFeatured();
    const sent = await resend.emails.send({
      from: process.env.RESEND_FROM || "Wilson Chao <hi@wilsonchao.com>",
      ...(process.env.RESEND_REPLY_TO ? { replyTo: process.env.RESEND_REPLY_TO } : {}),
      to: email,
      subject: "訂閱成功",
      html: welcomeEmailHtml(featured),
    });
    if (sent.error) {
      console.error("Resend welcome email failed:", sent.error);
    }
  } catch (err) {
    console.error("Resend welcome email failed:", err);
  }
}

// 新訂閱進來時通知 Wilson 本人（寄到 NOTIFY_EMAIL，預設用站方 reply-to）。
// 失敗不影響訂閱本身——訂閱者該收的歡迎信已經寄了，這只是給站長的旁路通知。
async function notifyNewSubscriber(
  email: string,
  source: string,
  total: number | null
) {
  const apiKey = process.env.RESEND_API_KEY;
  const notifyTo = process.env.NOTIFY_EMAIL || process.env.RESEND_REPLY_TO;
  if (!apiKey || !notifyTo) {
    console.warn("NOTIFY_EMAIL/RESEND_API_KEY not set — skipping owner notification.");
    return;
  }

  const resend = new Resend(apiKey);
  const totalLine =
    typeof total === "number" ? `<p style="color:#00505f;font-size:13px;">目前共 ${total} 位訂閱者。</p>` : "";

  const sent = await resend.emails.send({
    from: process.env.RESEND_FROM || "Wilson Chao <hi@wilsonchao.com>",
    to: notifyTo,
    // email 已過 isValidEmail（不含空白/CR/LF），subject 無 header injection 風險；
    // 若日後放寬 isValidEmail，這裡要改成跳脫
    subject: `📬 新訂閱：${email}`,
    html: `
      <div style="font-family:-apple-system,sans-serif;max-width:480px;line-height:1.8;color:#001219;">
        <p>有人剛訂閱了週報 🎉</p>
        <p>
          <strong>Email：</strong>${escapeHtml(email)}<br/>
          <strong>來源：</strong>${escapeHtml(source)}<br/>
          <strong>時間：</strong>${new Date().toISOString()}
        </p>
        ${totalLine}
      </div>
    `,
  });
  // Resend SDK 不 throw，錯誤在回傳值裡
  if (sent.error) {
    console.error("Owner notification email failed:", sent.error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // single opt-in：任何人都能拿任意 email 觸發歡迎信（寄件人是 hi@wilsonchao.com），
    // 不 rate limit 會被拿來騷擾別人、賠上寄件信譽
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const { allowed } = await rateLimit(`subscribe:${ip}`, {
      limit: 5,
      windowSeconds: 600,
    });
    if (!allowed) {
      return NextResponse.json(
        { error: "請求太頻繁，請稍後再試" },
        { status: 429 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      // 壞 JSON 是 client 的錯（400），不是 server 故障（500）
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const { email } = body;
    // source 由 client 控制，可能非字串；收斂成字串，
    // 否則 escapeHtml(source) 對非字串會 throw（通知靜默失敗、髒值還進 KV meta）
    const source = typeof body.source === "string" ? body.source : "unknown";

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "請輸入 email" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: "Email 格式好像不太對" },
        { status: 400 }
      );
    }

    // Check if already subscribed
    const exists = await kv.sismember(SUBSCRIBERS_KEY, normalizedEmail);
    if (exists) {
      return NextResponse.json(
        { message: "Already subscribed", alreadySubscribed: true },
        { status: 200 }
      );
    }

    // Add to subscribers set (歷史紀錄；寄送名單在 Resend)
    await kv.sadd(SUBSCRIBERS_KEY, normalizedEmail);

    // Store metadata
    const metaKey = `subscribers:${normalizedEmail}:meta`;
    await kv.set(metaKey, {
      subscribedAt: new Date().toISOString(),
      source: source || "unknown",
    });

    // Resend contact + welcome email。
    // 必須 await：serverless 在回應後會凍結 function，
    // fire-and-forget 的寄信會被砍在半路（實測過）。
    try {
      await addToResend(normalizedEmail);
    } catch (err) {
      console.error("Resend subscribe flow failed for", normalizedEmail, err);
      // contact 沒建成功 → rollback KV，讓用戶之後重訂時能再走一次完整流程，
      // 不然 email 留在 KV 會被「Already subscribed」擋住，永遠進不了寄送名單
      await kv.srem(SUBSCRIBERS_KEY, normalizedEmail);
      await kv.del(metaKey);
      return NextResponse.json(
        { error: "訂閱失敗了，請再試一次" },
        { status: 500 }
      );
    }

    // 訂閱已成立——通知站長（await 但失敗不影響回應，跟歡迎信同樣處理）
    try {
      const total = await kv.scard(SUBSCRIBERS_KEY);
      await notifyNewSubscriber(normalizedEmail, source || "unknown", total);
    } catch (err) {
      console.error("Owner notification failed for", normalizedEmail, err);
    }

    return NextResponse.json(
      { message: "Successfully subscribed", success: true },
      { status: 201 }
    );
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json(
      { error: "訂閱失敗了，請再試一次" },
      { status: 500 }
    );
  }
}
