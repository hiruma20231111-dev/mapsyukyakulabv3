// 営業の共有設定（Geminiキー）。保存はサーバー側のみ・値は返さない。
import { setGeminiKey, getGeminiKey } from "@/lib/store/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const key = await getGeminiKey();
  return json({ ok: true, hasKey: !!key });
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function POST(request: Request) {
  let b: any;
  try {
    b = await request.json();
  } catch {
    return json({ error: "リクエスト不正" }, 400);
  }
  const key = typeof b?.geminiKey === "string" ? b.geminiKey : "";
  await setGeminiKey(key);
  return json({ ok: true, hasKey: !!key.trim() });
}

function json(o: unknown, s = 200) {
  return new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } });
}
