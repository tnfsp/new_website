/**
 * watchdog-drawer.ts
 *
 * 抽屜資料管線的看門狗。跑在本機 / OWL 端（見交班決策）。
 * 檢查：
 *   1. 公開來源檔（OWL 產出的 *.public.jsonl）是否還在。
 *   2. content/drawer.json 是否存在且非空。
 *   3. 最新碎片日期是否超過 N 天沒更新（DRAWER_STALE_DAYS，預設 3）。
 * 任一異常 → Telegram 告警 Wilson 本人。一切正常 → 安靜（只印 log）。
 *
 * 兩種跑法：
 *   - 串在 sync 後面（sync:vault 末端），每次同步自我檢查「資料有沒有變新鮮」。
 *   - 每日獨立排程（launchd，見 scripts/com.wilson.drawer-watchdog.plist.example），
 *     才抓得到「sync 根本沒跑」這種沉默失敗。
 *
 * 永遠 exit 0（告警本身就是訊號，也不要弄壞串在前面的 sync 管線）。
 */

import { config as loadEnv } from "dotenv";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";
import os from "os";

loadEnv({ path: ".env.local" });

const DEFAULT_SOURCE = path.join(
  os.homedir(),
  ".openclaw/workspace/data/wilson-preferences.public.jsonl"
);
const SOURCE = process.env.WILSON_PREFS_PUBLIC?.trim() || DEFAULT_SOURCE;

const ROOT = process.cwd(); // apps/main
const DRAWER_PATH = path.join(ROOT, "content", "drawer.json");
const STALE_DAYS = Number(process.env.DRAWER_STALE_DAYS || "3");

async function sendTelegram(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN_ALT;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.warn(
      "[watchdog-drawer] TELEGRAM_BOT_TOKEN_ALT / TELEGRAM_CHAT_ID 未設定 — 無法告警，只印在 log。"
    );
    return false;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("[watchdog-drawer] Telegram 告警失敗:", err);
    return false;
  }
}

function daysBetween(fromISODate: string): number | null {
  const then = new Date(`${fromISODate}T00:00:00`);
  if (Number.isNaN(then.getTime())) return null;
  const now = new Date();
  return Math.floor((now.getTime() - then.getTime()) / 86_400_000);
}

async function main() {
  const problems: string[] = [];

  // 1. 公開來源檔
  if (!existsSync(SOURCE)) {
    problems.push(`公開來源檔不見了：${SOURCE}`);
  }

  // 2 + 3. 同步後的 drawer.json
  if (!existsSync(DRAWER_PATH)) {
    problems.push(`content/drawer.json 不存在（sync 沒跑過？）`);
  } else {
    let cards: Array<{ date?: string }> = [];
    let parseFailed = false;
    try {
      cards = JSON.parse(await readFile(DRAWER_PATH, "utf-8"));
    } catch {
      parseFailed = true;
      problems.push(`content/drawer.json 壞了，無法解析。`);
    }
    // 解析失敗時 cards 還是預設的 []——不要再多報一個「抽屜是空的」，
    // 檔案壞掉和真的空掉是兩回事。
    if (!parseFailed && Array.isArray(cards) && cards.length === 0) {
      problems.push(`抽屜是空的（0 張碎片）。`);
    } else if (Array.isArray(cards) && cards.length > 0) {
      const newest = cards
        .map((c) => c.date || "")
        .filter(Boolean)
        .sort()
        .at(-1);
      if (!newest) {
        problems.push(`碎片都沒有日期，無法判斷新鮮度。`);
      } else {
        const age = daysBetween(newest);
        if (age === null) {
          problems.push(`最新碎片日期格式怪怪的：${newest}`);
        } else if (age > STALE_DAYS) {
          problems.push(
            `抽屜 ${age} 天沒長新碎片了（最新：${newest}，門檻 ${STALE_DAYS} 天）。OWL 的每日提問或 sync 可能斷了。`
          );
        }
      }
    }
  }

  if (problems.length === 0) {
    console.log("[watchdog-drawer] OK — 抽屜資料新鮮，無異常。");
    return;
  }

  const message = ["⚠️ 抽屜看門狗：資料有狀況", "", ...problems.map((p) => `• ${p}`)].join(
    "\n"
  );
  console.warn(`[watchdog-drawer] 發現 ${problems.length} 個問題：\n${message}`);
  const sent = await sendTelegram(message);
  console.log(
    sent
      ? "[watchdog-drawer] 已 Telegram 告警。"
      : "[watchdog-drawer] 告警未送出（見上方原因）。"
  );
}

// 永遠 exit 0：別弄壞串在前面的 sync。
main().catch((err) => {
  console.error("[watchdog-drawer] 自己掛了:", err);
});
