/**
 * sync-lock.ts
 * Simple lock-file mechanism so sync-notion.ts and sync-vault.ts
 * cannot run at the same time and overwrite each other's output
 * in content/blog/.
 *
 * Usage:
 *   withSyncLock("sync-vault", main).catch(...)
 *
 * Behavior:
 * - Creates `.sync-lock` (next to content/, i.e. apps/main root) containing
 *   pid + owner + timestamp.
 * - If a lock already exists and is younger than 10 minutes, prints a message
 *   and exits (another sync is running).
 * - If the lock is older than 10 minutes it is considered stale (e.g. a
 *   previous sync crashed without cleanup) and is taken over.
 * - While the sync runs, the lock timestamp is refreshed every 60 seconds
 *   (heartbeat), so a legitimately long-running sync (> 10 minutes) does not
 *   get its lock stolen as "stale" by the next run.
 * - The lock is always released in a `finally` block, even when the sync fails.
 */

import { readFileSync, unlinkSync, writeFileSync } from "fs";
import path from "path";

// Sync scripts run with cwd = apps/main, so this resolves to apps/main/.sync-lock
const LOCK_PATH = path.join(process.cwd(), ".sync-lock");
const STALE_AFTER_MS = 10 * 60 * 1000; // 10 minutes
const HEARTBEAT_INTERVAL_MS = 60 * 1000; // refresh the lock timestamp every minute

type LockInfo = {
  pid: number;
  owner: string;
  timestamp: number;
};

function readLockInfo(): LockInfo | undefined {
  try {
    return JSON.parse(readFileSync(LOCK_PATH, "utf-8")) as LockInfo;
  } catch {
    return undefined;
  }
}

function tryCreateLock(owner: string): boolean {
  try {
    writeFileSync(
      LOCK_PATH,
      JSON.stringify(
        { pid: process.pid, owner, timestamp: Date.now() },
        null,
        2
      ),
      { flag: "wx" } // atomic create: fails if the file already exists
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Acquire the sync lock, or exit the process if another sync is running.
 */
export function acquireSyncLock(owner: string): void {
  if (tryCreateLock(owner)) return;

  // A lock file already exists — check whether it is stale.
  const existing = readLockInfo();
  const ageMs = existing
    ? Date.now() - existing.timestamp
    : Number.POSITIVE_INFINITY; // unreadable lock file → treat as stale

  if (ageMs < STALE_AFTER_MS) {
    const holder = existing
      ? `${existing.owner} (pid ${existing.pid})`
      : "unknown process";
    console.error(
      `[${owner}] Another sync is already running: ${holder}.\n` +
        `[${owner}] If you are sure it is not, delete ${LOCK_PATH} and retry.`
    );
    process.exit(1);
  }

  console.warn(
    `[${owner}] Stale lock detected (older than 10 minutes), taking over: ${LOCK_PATH}`
  );
  try {
    unlinkSync(LOCK_PATH);
  } catch {
    // Already removed by someone else — fall through to re-create below.
  }
  if (!tryCreateLock(owner)) {
    console.error(
      `[${owner}] Failed to take over the lock (another sync grabbed it first). Aborting.`
    );
    process.exit(1);
  }
}

/**
 * Release the sync lock. Safe to call even if the lock is already gone.
 */
export function releaseSyncLock(): void {
  try {
    unlinkSync(LOCK_PATH);
  } catch {
    // Lock already removed — nothing to do.
  }
}

/**
 * Run `fn` while holding the sync lock; the lock is always released.
 */
export async function withSyncLock<T>(
  owner: string,
  fn: () => Promise<T>
): Promise<T> {
  acquireSyncLock(owner);
  // Heartbeat：sync 跑超過 STALE_AFTER_MS（10 分鐘）的話，
  // 下一次執行會把還活著的鎖當成 stale 搶走。
  // 所以持鎖期間每 60 秒刷新一次 timestamp，證明我們還在跑。
  // .unref() 讓這個 timer 不會把 process 吊著不放。
  const heartbeat = setInterval(() => {
    try {
      writeFileSync(
        LOCK_PATH,
        JSON.stringify(
          { pid: process.pid, owner, timestamp: Date.now() },
          null,
          2
        )
      );
    } catch {
      // 刷新失敗不致命——最壞情況回到原本的 stale-takeover 行為。
    }
  }, HEARTBEAT_INTERVAL_MS);
  heartbeat.unref();
  try {
    return await fn();
  } finally {
    clearInterval(heartbeat);
    releaseSyncLock();
  }
}
