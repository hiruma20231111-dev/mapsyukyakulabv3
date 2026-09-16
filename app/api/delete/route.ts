// 店舗を削除（自分のGeminiキーを知る人だけ）。v1 から移植。
import { deleteStore, ownerHash, storeReady } from "@/lib/store/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function POST(request: Request) {
  if (!storeReady()) return json({ error: "ストア未接続" }, 400);
  let b: any;
  try {
    b = await request.json();
  } catch {
    return json({ error: "不正なリクエスト" }, 400);
  }
  const gk = (b?.geminiKey || "").trim();
  const id = b?.id;
  if (!gk || !id) return json({ error: "情報が不足しています。" }, 400);
  await deleteStore(ownerHash(gk), id);
  return json({ ok: true });
}

function json(o: unknown, s = 200) {
  return new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } });
}
