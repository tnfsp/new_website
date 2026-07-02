import { kv } from "@vercel/kv";

/**
 * KV 裡的「清單」（留言、抽屜紙條）早期是整包 JSON array（get → 改 → set），
 * 兩個請求同時寫會互相蓋掉對方的資料。現在改用 Redis list：
 * lpush 是原子的 append，天生沒有蓋寫問題，還能用 ltrim 設上限。
 *
 * 舊 key 可能還是 array 格式，所以讀寫都做懶遷移：
 * 讀取時自動辨識兩種格式；寫入時先把舊 array 轉成 list 再 push。
 */

export async function readKvList<T>(key: string): Promise<T[]> {
  const keyType = await kv.type(key);
  if (keyType === "list") {
    return (await kv.lrange<T>(key, 0, -1)) ?? [];
  }
  if (keyType === "none") return [];
  return (await kv.get<T[]>(key)) ?? [];
}

export async function pushToKvList<T>(
  key: string,
  item: T,
  maxLen?: number
): Promise<void> {
  const keyType = await kv.type(key);
  if (keyType !== "list" && keyType !== "none") {
    // 舊格式（JSON array，最新在前）→ 轉成 list，維持 newest-first
    const old = (await kv.get<T[]>(key)) ?? [];
    await kv.del(key);
    if (old.length > 0) {
      await kv.rpush(key, ...(old as unknown[]));
    }
  }
  await kv.lpush(key, item);
  if (maxLen && maxLen > 0) {
    await kv.ltrim(key, 0, maxLen - 1);
  }
}

/** 清單長度；同樣相容新舊兩種格式。 */
export async function kvListLength(key: string): Promise<number> {
  const keyType = await kv.type(key);
  if (keyType === "list") return await kv.llen(key);
  if (keyType === "none") return 0;
  const old = (await kv.get<unknown[]>(key)) ?? [];
  return Array.isArray(old) ? old.length : 0;
}
