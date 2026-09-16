// 診断用ヘルスチェック：Redis接続状態を確認する（値は返さず、キー名とpingのみ）。
import { getClient, storeReady, resolveStoreUrl } from "@/lib/store/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const hasRedisUrl = !!process.env.REDIS_URL;
  const hasKvUrl = !!process.env.KV_URL;
  // redis/kv/upstash/storage を含む env のキー名だけ（値は出さない）。
  const relatedKeys = Object.keys(process.env).filter((k) => /redis|kv|upstash|storage/i.test(k)).sort();
  // 値の“先頭スキーム”だけ（例 rediss:// / https://）を安全に覗く。
  const scheme = (v?: string) => (v ? String(v).split("://")[0].slice(0, 10) : null);
  const urlScheme = scheme(resolveStoreUrl());

  let ping = "skip";
  let err = "";
  const c = getClient();
  if (c) {
    try {
      await c.set("health:ping", "1", "EX", 30);
      ping = (await c.get("health:ping")) === "1" ? "ok" : "mismatch";
    } catch (e) {
      ping = "error";
      err = (e instanceof Error ? e.message : String(e)).slice(0, 200);
    }
  }

  return Response.json({ storeReady: storeReady(), hasRedisUrl, hasKvUrl, urlScheme, relatedKeys, ping, err });
}
