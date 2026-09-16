// サーバー共有設定（営業が設定画面で入れた1つのGeminiキーを、全診断・相談・精査で使う）。
// Redis があればそれを使い、無ければプロセス内メモリにフォールバック。値はサーバー側のみ・クライアントに返さない。
import { getClient } from "./redis";

const g = globalThis as unknown as { __maplabConfig?: Map<string, string> };
const mem: Map<string, string> = g.__maplabConfig ?? (g.__maplabConfig = new Map());

async function setConfig(key: string, value: string): Promise<void> {
  const c = getClient();
  if (c) {
    try {
      if (value) await c.set(`config:${key}`, value);
      else await c.del(`config:${key}`);
      return;
    } catch { /* フォールバックへ */ }
  }
  if (value) mem.set(key, value);
  else mem.delete(key);
}

async function getConfig(key: string): Promise<string> {
  const c = getClient();
  if (c) {
    try {
      const v = await c.get(`config:${key}`);
      if (v != null) return v;
    } catch { /* フォールバックへ */ }
  }
  return mem.get(key) ?? "";
}

export async function setGeminiKey(key: string): Promise<void> {
  return setConfig("gemini_key", (key || "").trim());
}
export async function getGeminiKey(): Promise<string> {
  return getConfig("gemini_key");
}
