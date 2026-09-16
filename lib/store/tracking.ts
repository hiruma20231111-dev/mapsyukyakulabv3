// 利用イベントの記録（オーナー単位・最新500件・60日で失効）。v1 store.js から分離。
import { getClient } from "./redis";

export interface UsageEvent {
  type: string;
  id?: string;
  label?: string;
  detail?: string;
  ts?: number;
}

export async function logEvent(owner: string, event: UsageEvent): Promise<void> {
  const c = getClient();
  if (!c || !owner) return;
  const key = `usage:${owner}`;
  try {
    await c.lpush(key, JSON.stringify({ ...event, ts: Date.now() }));
    await c.ltrim(key, 0, 499);
    await c.expire(key, 5184000); // 60日
  } catch {}
}

// オーナーのイベント取得（新しい順）
export async function getEvents(owner: string): Promise<UsageEvent[]> {
  const c = getClient();
  if (!c || !owner) return [];
  try {
    const res = await c.lrange(`usage:${owner}`, 0, 499);
    if (!Array.isArray(res)) return [];
    return res
      .map((s) => {
        try {
          return JSON.parse(s) as UsageEvent;
        } catch {
          return null;
        }
      })
      .filter((x): x is UsageEvent => x != null);
  } catch {
    return [];
  }
}
