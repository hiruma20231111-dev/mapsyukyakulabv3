// 軽量ストア（Upstash/Vercel Redis を REDIS_URL でTCP接続）。v1 store.js から移植。
// サーバー専用（API ルートから使う）。
import crypto from "node:crypto";
import Redis from "ioredis";

// 接続URLを解決。プレフィックス付き（例 maps_REDIS_URL）にも対応するため、
// 明示名→一般スキャン（*_REDIS_URL / *_KV_URL）の順で最初に値のあるものを使う。
export function resolveStoreUrl(): string {
  if (process.env.REDIS_URL) return process.env.REDIS_URL;
  if (process.env.KV_URL) return process.env.KV_URL;
  const hit = Object.entries(process.env).find(
    ([k, v]) => !!v && /(^|_)(REDIS|KV)_URL$/i.test(k) && /^rediss?:\/\//i.test(String(v)),
  );
  return hit ? String(hit[1]) : "";
}

const URL = resolveStoreUrl();

let client: Redis | null = null;
export function getClient(): Redis | null {
  if (!URL) return null;
  if (!client) {
    client = new Redis(URL, { maxRetriesPerRequest: 2, enableReadyCheck: false, lazyConnect: false });
    client.on("error", () => {}); // 例外でクラッシュさせない
  }
  return client;
}

export function storeReady(): boolean {
  return !!URL;
}

// Geminiキー → オーナー識別ハッシュ（ダッシュボードはキーを知る人だけ閲覧可）
export function ownerHash(geminiKey: string | undefined | null): string {
  return crypto.createHash("sha256").update("owner:" + (geminiKey || "")).digest("hex").slice(0, 24);
}

export interface InviteRecord {
  id: string;
  label?: string;
  exp?: number;
  model?: string;
  [k: string]: unknown;
}

export interface DiagRecord {
  label?: string;
  text: string;
  total?: number;
  grade?: string;
  answers?: unknown;
  background?: string;
  ts?: number;
}

// 発行した招待（店舗）を保存：発行時にダッシュボードへ並ぶ
export async function saveInvite(owner: string, rec: InviteRecord): Promise<void> {
  const c = getClient();
  if (!c || !owner || !rec?.id) return;
  try {
    await c.hset(`invites:${owner}`, rec.id, JSON.stringify(rec));
    await c.expire(`invites:${owner}`, 7776000); // 90日
  } catch {}
}

// 発行済み招待一覧
export async function getInvites(owner: string): Promise<InviteRecord[]> {
  const c = getClient();
  if (!c || !owner) return [];
  try {
    const h = await c.hgetall(`invites:${owner}`);
    if (!h) return [];
    return Object.values(h)
      .map((s) => {
        try {
          return JSON.parse(s) as InviteRecord;
        } catch {
          return null;
        }
      })
      .filter((x): x is InviteRecord => x != null);
  } catch {
    return [];
  }
}

// 店舗を削除（招待レコード＋その店のイベント＋診断を消す）
export async function deleteStore(owner: string, id: string): Promise<void> {
  const c = getClient();
  if (!c || !owner || !id) return;
  try {
    await c.hdel(`invites:${owner}`, id);
    await c.hdel(`diag:${owner}`, id);
    const key = `usage:${owner}`;
    const arr = await c.lrange(key, 0, 499);
    const keep = (arr || []).filter((s) => {
      try {
        return (JSON.parse(s) as { id?: string }).id !== id;
      } catch {
        return true;
      }
    });
    await c.del(key);
    if (keep.length) await c.rpush(key, ...keep); // 新しい順のまま復元
  } catch {}
}

// 診断結果を保存（店舗単位・最新のみ上書き）
export async function saveDiag(owner: string, id: string, data: DiagRecord): Promise<void> {
  const c = getClient();
  if (!c || !owner || !id) return;
  try {
    await c.hset(`diag:${owner}`, id, JSON.stringify({ ...data, ts: Date.now() }));
    await c.expire(`diag:${owner}`, 7776000); // 90日
  } catch {}
}

// 特定店舗の最新診断を取得
export async function getDiag(owner: string, id: string): Promise<DiagRecord | null> {
  const c = getClient();
  if (!c || !owner || !id) return null;
  try {
    const s = await c.hget(`diag:${owner}`, id);
    return s ? (JSON.parse(s) as DiagRecord) : null;
  } catch {
    return null;
  }
}

// オーナーの全診断（id→{ts} の軽いマップ。ダッシュボードのバッジ用）
export async function getDiagMap(owner: string): Promise<Record<string, { ts: number }>> {
  const c = getClient();
  if (!c || !owner) return {};
  try {
    const h = await c.hgetall(`diag:${owner}`);
    const out: Record<string, { ts: number }> = {};
    for (const [id, s] of Object.entries(h || {})) {
      try {
        const d = JSON.parse(s) as { ts?: number };
        out[id] = { ts: d.ts || 0 };
      } catch {}
    }
    return out;
  } catch {
    return {};
  }
}
