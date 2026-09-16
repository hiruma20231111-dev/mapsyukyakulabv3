// V3 公開診断レコード（slug単位）。オーナー様がキー無しで /d/<slug> を開けるようにする。
// Redis があればそれを使い、無ければプロセス内メモリにフォールバック（dev・Redis未接続でも動く）。
import { getClient } from "./redis";
import type { V3Answers } from "@/lib/domain/score";
import type { CategoryKey } from "@/content/diagnosis-v3";

export interface PublicDiagnosis {
  slug: string;
  storeName: string;
  answers: V3Answers;
  query?: string;
  weights?: Partial<Record<CategoryKey, number>>;
  /** AI相談用の資格情報（サーバ側のみ・クライアントには渡さない）。営業のGemini invite/key。 */
  creds?: { invite?: string; key?: string };
  ts: number;
}

const TTL = 7776000; // 90日
// Redis未接続時のフォールバック。dev の HMR/モジュール再評価をまたいで共有するため globalThis に保持。
const g = globalThis as unknown as { __maplabPubDiag?: Map<string, PublicDiagnosis> };
const mem: Map<string, PublicDiagnosis> = g.__maplabPubDiag ?? (g.__maplabPubDiag = new Map());

function slugify(name: string): string {
  // URLに安全な ASCII slug（日本語など非ASCIIは落とす）。英数字が無ければ "d"。
  const base = (name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 20);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${base || "d"}-${rand}`;
}

/** 保存して slug を返す。 */
export async function savePublicDiagnosis(
  input: Omit<PublicDiagnosis, "slug" | "ts">,
): Promise<string> {
  const slug = slugify(input.storeName);
  const rec: PublicDiagnosis = { ...input, slug, ts: Date.now() };
  const c = getClient();
  if (c) {
    try {
      await c.set(`pubdiag:${slug}`, JSON.stringify(rec), "EX", TTL);
      await c.lpush(INDEX_KEY, slug);
      await c.ltrim(INDEX_KEY, 0, 499);
      await c.expire(INDEX_KEY, TTL);
      return slug;
    } catch {
      /* フォールバックへ */
    }
  }
  mem.set(slug, rec);
  return slug;
}

const INDEX_KEY = "pubdiag:index";

// ---- 稼働状況（閲覧・相談の回数と最終アクセス）----
export interface DiagStats { views: number; consults: number; lastTs: number }
const gs = globalThis as unknown as { __maplabStats?: Map<string, DiagStats> };
const statMem: Map<string, DiagStats> = gs.__maplabStats ?? (gs.__maplabStats = new Map());

export async function recordEvent(slug: string, type: "views" | "consults"): Promise<void> {
  if (!slug) return;
  const now = Date.now();
  const c = getClient();
  if (c) {
    try {
      await c.hincrby(`pubdiag:stat:${slug}`, type, 1);
      await c.hset(`pubdiag:stat:${slug}`, "lastTs", String(now));
      await c.expire(`pubdiag:stat:${slug}`, TTL);
      return;
    } catch { /* フォールバックへ */ }
  }
  const s = statMem.get(slug) ?? { views: 0, consults: 0, lastTs: 0 };
  s[type] += 1;
  s.lastTs = now;
  statMem.set(slug, s);
}

export async function getStats(slug: string): Promise<DiagStats> {
  const empty: DiagStats = { views: 0, consults: 0, lastTs: 0 };
  if (!slug) return empty;
  const c = getClient();
  if (c) {
    try {
      const h = await c.hgetall(`pubdiag:stat:${slug}`);
      if (h && Object.keys(h).length) {
        return { views: +(h.views || 0), consults: +(h.consults || 0), lastTs: +(h.lastTs || 0) };
      }
    } catch { /* フォールバックへ */ }
  }
  return statMem.get(slug) ?? empty;
}

/** 最近発行した診断（新しい順）。管理画面の一覧用。 */
export async function listRecentDiagnoses(limit = 50): Promise<PublicDiagnosis[]> {
  const c = getClient();
  if (c) {
    try {
      const slugs = await c.lrange(INDEX_KEY, 0, limit - 1);
      const out: PublicDiagnosis[] = [];
      for (const s of slugs || []) {
        const rec = await getPublicDiagnosis(s);
        if (rec) out.push(rec);
      }
      if (out.length) return out;
    } catch {
      /* フォールバックへ */
    }
  }
  return [...mem.values()].sort((a, b) => b.ts - a.ts).slice(0, limit);
}

/** slug から公開診断を取得（無ければ null）。 */
export async function getPublicDiagnosis(slug: string): Promise<PublicDiagnosis | null> {
  if (!slug) return null;
  const c = getClient();
  if (c) {
    try {
      const s = await c.get(`pubdiag:${slug}`);
      if (s) return JSON.parse(s) as PublicDiagnosis;
    } catch {
      /* フォールバックへ */
    }
  }
  return mem.get(slug) ?? null;
}
