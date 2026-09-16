// オーナー様のAI相談：slug から公開診断＋営業のcredsを読み、診断コンテキスト付きでGeminiに相談する。
// キー（invite/key）は発行時にサーバ側へ保存されており、クライアントには渡さない。
import { getPublicDiagnosis } from "@/lib/store/diagnosis-store";
import { verifyToken } from "@/lib/store/invite";
import { buildResultView } from "@/features/result";
import {
  buildSystemPrompt,
  buildConsultUserPrompt,
  historyToContents,
  callGemini,
  type GeminiContent,
  type HistoryTurn,
} from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function POST(request: Request) {
  let b: any;
  try {
    b = await request.json();
  } catch {
    return json({ error: "リクエスト不正" }, 400);
  }
  const slug = String(b?.slug || "").trim();
  const question = String(b?.question || "").trim();
  const history: HistoryTurn[] = Array.isArray(b?.history) ? b.history : [];
  if (!slug) return json({ error: "診断が特定できません。" }, 400);
  if (!question) return json({ error: "質問が空です。" }, 400);

  const rec = await getPublicDiagnosis(slug);
  if (!rec) return json({ error: "診断が見つかりませんでした。" }, 404);

  // AI相談用の資格情報（発行時に営業が付与）。無ければ相談は未提供。
  let apiKey = rec.creds?.key || "";
  let model = "gemini-2.5-flash";
  if (!apiKey && rec.creds?.invite) {
    const v = verifyToken(rec.creds.invite);
    if (v && !v.expired && v.gk) {
      apiKey = v.gk;
      if (v.model) model = v.model;
    }
  }
  if (!apiKey) {
    return json({ unavailable: true, error: "このお店のAI相談はまだ準備中です。担当者にお問い合わせください。" });
  }

  // 診断コンテキスト（弱い項目＝伸びしろの大きい順）。
  const view = buildResultView(rec.storeName, rec.answers, { query: rec.query, weights: rec.weights });
  const weak = [...view.categories]
    .sort((a, b2) => a.ratio - b2.ratio)
    .slice(0, 3)
    .map((c) => c.name);
  const diagnosis = { total: view.total, grade: view.rank, weak };

  const system = buildSystemPrompt("std", "polite");
  const contents: GeminiContent[] = [];
  for (const c of historyToContents(history)) contents.push(c);
  contents.push({ role: "user", parts: [{ text: buildConsultUserPrompt({ question, diagnosis }) }] });

  try {
    const res = await callGemini({ apiKey, model, systemInstruction: system, contents, mode: "consult" });
    if (!res.ok) return json({ error: res.error || "AIの応答に失敗しました。" });
    return json({ ok: true, answer: res.text });
  } catch (e: any) {
    return json({ error: "通信エラー: " + (e?.message || e) });
  }
}

function json(o: unknown, s = 200) {
  return new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } });
}
