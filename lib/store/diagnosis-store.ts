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
      return slug;
    } catch {
      /* フォールバックへ */
    }
  }
  mem.set(slug, rec);
  return slug;
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
