/**
 * write-file-atomic.ts
 * 內容 JSON 的 atomic 寫入 helper（sync-notion / sync-vault 共用）。
 *
 * 直接 writeFile 蓋掉原檔的話，sync 中途 crash 會留下寫到一半的 JSON，
 * 同時在跑的 `next build` 或 git auto-commit 就會讀到半份內容。
 * 先寫到同目錄的 `.tmp` 再 rename——rename 在同一個檔案系統上是 atomic 的，
 * 讀取方永遠只會看到「舊的完整檔」或「新的完整檔」，不會有中間狀態。
 */

import { rename, writeFile } from "fs/promises";

export async function writeFileAtomic(filePath: string, data: string): Promise<void> {
  const tmpPath = `${filePath}.tmp`;
  await writeFile(tmpPath, data, "utf-8");
  await rename(tmpPath, filePath);
}
