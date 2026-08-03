/**
 * 週報電子報寄送 script
 *
 * 用法：
 *   npm run newsletter -- <slug>            # 建立 Resend Broadcast 草稿（不寄出）
 *   npm run newsletter -- <slug> --send     # 建立並直接寄出
 *   npm run newsletter -- --send-existing <broadcastId>
 *       # 寄出「既有」草稿（不會建新的）。草稿模式跑完會印出這行指令。
 *   npm run newsletter -- <slug> --preview  # 只輸出信件 HTML 到暫存檔（不需要 env）
 *   npm run newsletter -- <slug> --force    # 允許非週報類型或非 Published 狀態（預設兩者都擋）
 *   npm run newsletter -- <slug> --intro "這期想說的話"
 *       # email 限定開場白：放在信件最上方、週報內容之前，像信的開頭。
 *       # 永遠 optional——沒給就直接從週報內容開始，承諾不因此打折。
 *       # 多段落用 \n 分隔。
 *
 * 預設行為是「只建草稿」：到 Resend dashboard 預覽（要改就直接在 dashboard 改），
 * 確認無誤後用 --send-existing <broadcastId> 寄出「同一個」草稿。
 * 注意：不要用 --send 重跑——那會「再建立一個新的」broadcast 並寄出，
 * 你在 dashboard 上做的任何修改都會被丟掉。
 * 誤寄無法收回，所以不做全自動。
 *
 * 需要環境變數（.env.local 或 shell）：
 *   RESEND_API_KEY     — Resend API key
 *   RESEND_SEGMENT_ID  — 訂閱者 segment
 *   RESEND_FROM        — 寄件者（選填，預設 "Wilson Chao <hi@wilsonchao.com>"）
 *   RESEND_REPLY_TO    — 回信地址（選填）
 */
import { config as loadEnv } from "dotenv";
import { Resend } from "resend";
import fs from "fs/promises";
import path from "path";
import { escapeHtml } from "../lib/escape-html.js";

loadEnv({ path: ".env.local" });

const SITE_URL = "https://wilsonchao.com";
const WEEKLY_TYPES = new Set(["週報", "weekly"]);

type BlogEntry = {
  slug: string;
  title: string;
  type?: string;
  status?: string;
  publishedAt?: string;
  contentHtml?: string;
  excerpt?: string;
  description?: string;
  image?: string;
};

/** 把 contentHtml 裡的相對路徑（圖片、站內連結）轉成絕對網址，email 裡才看得到 */
function absolutifyUrls(html: string): string {
  return html
    .replace(/(src|href)="\/(?!\/)/g, `$1="${SITE_URL}/`);
}

/**
 * email client 沒有 CSS reset：contentHtml 裡的 <img> 若沒有 inline style，
 * 會用「原始像素寬」渲染。手機拍的照片動輒 4032px，直接撐爆 560px 的容器，
 * 整封信的版就跑掉（#024 實例）。網頁版有 CSS 所以看不出來。
 * width 屬性是給 Outlook（Word 引擎會忽略 max-width）。
 */
const EMAIL_BODY_WIDTH = 528; // 560 容器 - 左右各 16 padding
function inlineImageStyles(html: string): string {
  return html
    .replace(/<figure(\s|>)/g, '<figure style="margin:0 0 24px;"$1')
    .replace(/<figcaption(\s|>)/g, '<figcaption style="font-size:13px;line-height:1.7;color:#00505f;margin-top:8px;"$1')
    .replace(/<img\b(?![^>]*\bstyle=)([^>]*?)\/?>/g, (_m, attrs) =>
      `<img${attrs} width="${EMAIL_BODY_WIDTH}" style="display:block;width:100%;max-width:100%;height:auto;border-radius:12px;" />`
    );
}

function newsletterHtml(entry: BlogEntry, intro?: string): string {
  // email 限定開場白：只有訂閱者看得到的幾句話，放在週報內容之前
  // shell 傳進來的 \n 是字面「反斜線+n」兩個字元，和真的換行都接受
  const introBlock = intro
    ? `<div style="line-height:1.9;margin-bottom:24px;">
        ${intro
          .split(/\\n|\n/)
          .map((p) => p.trim())
          .filter(Boolean)
          .map((p) => `<p style="margin:0 0 1em;">${escapeHtml(p)}</p>`)
          .join("\n")}
      </div>
      <hr style="border:none;border-top:1px solid rgba(0,18,25,0.14);margin:0 0 24px;" />`
    : "";

  const cover = entry.image
    ? `<img src="${escapeHtml(entry.image.startsWith("http") ? entry.image : SITE_URL + entry.image)}" alt="${escapeHtml(entry.title)}" style="width:100%;border-radius:12px;margin-bottom:24px;" />`
    : "";

  const body = inlineImageStyles(absolutifyUrls(entry.contentHtml ?? ""));
  const postUrl = `${SITE_URL}/blog/${encodeURIComponent(entry.slug)}`;

  return `
    <div style="font-family:'Noto Sans TC',-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px 16px;background-color:#f8f4ea;color:#001219;">
      ${introBlock}
      ${cover}
      <h1 style="font-size:1.5em;line-height:1.4;margin:0 0 24px;">${escapeHtml(entry.title)}</h1>
      <div style="line-height:1.9;">
        ${body}
      </div>
      <div style="line-height:1.9;margin-top:32px;">
        <p style="margin:0 0 0.4em;">下週見，</p>
        <p style="margin:0;">Wilson</p>
      </div>
      <hr style="border:none;border-top:1px solid rgba(0,18,25,0.14);margin:32px 0 16px;" />
      <p style="color:#00505f;font-size:13px;line-height:1.8;">
        有想說的話，直接回這封信就好，我會看到。<br/>
        也可以<a href="${postUrl}" style="color:#ca6702;">在網頁上讀</a>。<br/>
        不想再收到：<a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#00505f;">取消訂閱</a>
      </p>
    </div>
  `;
}

async function main() {
  const args = process.argv.slice(2);
  const doSend = args.includes("--send");
  const force = args.includes("--force");
  const previewOnly = args.includes("--preview");
  const introIdx = args.indexOf("--intro");
  const intro = introIdx !== -1 ? args[introIdx + 1] : undefined;
  const sendExistingIdx = args.indexOf("--send-existing");
  const sendExistingId =
    sendExistingIdx !== -1 ? args[sendExistingIdx + 1] : undefined;
  // 找 slug 時要跳過 --intro / --send-existing 的值，不然它們會被誤認成 slug
  const slug = args.find(
    (a, i) =>
      !a.startsWith("--") &&
      (introIdx === -1 || i !== introIdx + 1) &&
      (sendExistingIdx === -1 || i !== sendExistingIdx + 1)
  );
  if (introIdx !== -1 && (!intro || intro.startsWith("--"))) {
    console.error("--intro 後面要接開場白文字（用引號包起來）");
    process.exit(1);
  }

  // --send-existing：寄出 dashboard 上已存在的草稿（含在 dashboard 做的修改），
  // 而不是重建一個新的 broadcast。不需要 slug。
  if (sendExistingIdx !== -1) {
    if (!sendExistingId || sendExistingId.startsWith("--")) {
      console.error("--send-existing 後面要接 broadcast id");
      process.exit(1);
    }
    const existingApiKey = process.env.RESEND_API_KEY;
    if (!existingApiKey) {
      console.error("缺少環境變數：RESEND_API_KEY");
      process.exit(1);
    }
    const resend = new Resend(existingApiKey);
    const sent = await resend.broadcasts.send(sendExistingId);
    if (sent.error) {
      console.error("寄出失敗：", sent.error);
      process.exit(1);
    }
    console.log(`📨 已寄出既有 Broadcast：${sendExistingId}`);
    return;
  }

  if (!slug) {
    console.error(
      '用法：npm run newsletter -- <slug> [--send|--preview] [--force] [--intro "開場白"]\n' +
        "　　　npm run newsletter -- --send-existing <broadcastId>"
    );
    process.exit(1);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const segmentId = process.env.RESEND_SEGMENT_ID;
  if (!previewOnly && (!apiKey || !segmentId)) {
    console.error(
      "缺少環境變數：" +
        [!apiKey && "RESEND_API_KEY", !segmentId && "RESEND_SEGMENT_ID"]
          .filter(Boolean)
          .join("、")
    );
    process.exit(1);
  }

  const filePath = path.join(process.cwd(), "content", "blog", `${slug}.json`);
  let entry: BlogEntry;
  try {
    entry = JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    console.error(`找不到或無法解析 ${filePath}`);
    process.exit(1);
  }

  if (!WEEKLY_TYPES.has(entry.type ?? "") && !force) {
    console.error(
      `「${entry.title}」的 type 是 ${entry.type ?? "(未設定)"}，不是週報。` +
        `確定要寄的話加 --force。`
    );
    process.exit(1);
  }

  if (entry.status !== "Published" && !force) {
    console.error(
      `「${entry.title}」的 status 是 ${entry.status ?? "(未設定)"}，還沒發布。` +
        `確定要寄草稿的話加 --force。`
    );
    process.exit(1);
  }

  if (!entry.contentHtml) {
    console.error(`${slug} 沒有 contentHtml，無法組信。`);
    process.exit(1);
  }

  if (previewOnly) {
    const os = await import("os");
    const outPath = path.join(os.tmpdir(), `newsletter-${slug}.html`);
    await fs.writeFile(outPath, newsletterHtml(entry, intro), "utf8");
    console.log(`👀 預覽已輸出：${outPath}`);
    console.log(`   subject: ${entry.title}`);
    console.log(`   preview: ${entry.excerpt || entry.description || "(無)"}`);
    return;
  }

  // 走到這裡必然非 preview 模式；前面已驗證過 env，這裡是型別收窄
  if (!apiKey || !segmentId) process.exit(1);

  const resend = new Resend(apiKey);
  const created = await resend.broadcasts.create({
    segmentId,
    from: process.env.RESEND_FROM || "Wilson Chao <hi@wilsonchao.com>",
    ...(process.env.RESEND_REPLY_TO ? { replyTo: process.env.RESEND_REPLY_TO } : {}),
    subject: entry.title,
    previewText: entry.excerpt || entry.description || "",
    name: `週報：${entry.title}（${slug}）`,
    html: newsletterHtml(entry, intro),
  });

  if (created.error || !created.data) {
    console.error("建立 Broadcast 失敗：", created.error);
    process.exit(1);
  }

  console.log(`✅ Broadcast 草稿已建立：${created.data.id}`);
  console.log(`   預覽：https://resend.com/broadcasts/${created.data.id}`);

  if (doSend) {
    const sent = await resend.broadcasts.send(created.data.id);
    if (sent.error) {
      console.error("寄出失敗：", sent.error);
      process.exit(1);
    }
    console.log(`📨 已寄出「${entry.title}」`);
  } else {
    console.log("   （未寄出——到 dashboard 預覽/修改，確認後寄出「這一個」草稿：）");
    console.log(`   npm run newsletter -- --send-existing ${created.data.id}`);
    console.log("   （不要加 --send 重跑：那會建立並寄出另一個新的 broadcast，dashboard 上的修改會被丟掉）");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
