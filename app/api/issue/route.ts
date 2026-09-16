// 診断を発行：入力を公開レコードとして保存し、固有 slug / URL を返す。
import { savePublicDiagnosis } from "@/lib/store/diagnosis-store";

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
  const storeName = String(b?.storeName || "").trim();
  const answers = b?.answers;
  if (!storeName) return json({ error: "店舗名を入力してください。" }, 400);
  if (!answers || typeof answers !== "object") return json({ error: "診断内容がありません。" }, 400);

  const slug = await savePublicDiagnosis({
    storeName,
    answers,
    query: typeof b?.query === "string" ? b.query : undefined,
    weights: b?.weights && typeof b.weights === "object" ? b.weights : undefined,
  });
  return json({ ok: true, slug, path: `/d/${slug}` });
}

function json(o: unknown, s = 200) {
  return new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } });
}
