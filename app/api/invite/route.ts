// 招待リンク発行：Geminiキーを暗号化して埋め込む。v1 から移植。
import { mintToken, verifyToken } from "@/lib/store/invite";
import { saveInvite, ownerHash } from "@/lib/store/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function POST(request: Request) {
  let b: any;
  try {
    b = await request.json();
  } catch {
    return json({ error: "不正なリクエスト" }, 400);
  }
  const { geminiKey, label, days, model } = b || {};
  const gk = (geminiKey || "").trim();
  if (!gk || gk.length < 10) {
    return json({ error: "Geminiキーを入力してください（Google AI Studioで発行できます）。" }, 400);
  }
  const token = mintToken({ geminiKey: gk, label, days, model });
  const v = verifyToken(token);
  if (!v) return json({ error: "トークンの生成に失敗しました。" }, 500);
  try {
    await saveInvite(ownerHash(gk), { id: v.id, label: v.label || "（無題）", exp: v.exp, created: Date.now(), token });
  } catch {}
  return json({ token, label: v.label, exp: v.exp });
}

function json(o: unknown, s = 200) {
  return new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } });
}
