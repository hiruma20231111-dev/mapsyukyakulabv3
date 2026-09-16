// オーナー様のAI相談：slug から公開診断＋営業のcredsを読み、診断コンテキスト付きでGeminiに相談する。
// キー（invite/key）は発行時にサーバ側へ保存されており、クライアントには渡さない。
import { getPublicDiagnosis } from "@/lib/store/diagnosis-store";
import { getGeminiKey } from "@/lib/store/config";
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
  // 営業が設定画面で入れた共有キー（サーバー保存）→ 最後に環境変数。1つ設定すれば全診断で有効。
  if (!apiKey) apiKey = await getGeminiKey();
  if (!apiKey) apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
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

  const styleNote =
    "\n\n[回答スタイル・厳守]\n" +
    "・広く一般的な質問（「何から始める？」等）には、要点を2〜3個に絞って各1〜2文で端的に答える。長文にしない。\n" +
    "・具体的な質問には、手順を含めてしっかり丁寧に答える。\n" +
    "・専門用語は使わず、店主にやさしい言葉で。\n" +
    "・回答の最後に必ず、次に深掘りできる短い質問候補を2〜3個、下記の形式だけで付ける（本文には含めない）:\n" +
    "<<SUGGEST>>\n・（候補1）\n・（候補2）\n・（候補3）";

  const system = buildSystemPrompt("std", "polite");
  const contents: GeminiContent[] = [];
  for (const c of historyToContents(history)) contents.push(c);
  contents.push({ role: "user", parts: [{ text: buildConsultUserPrompt({ question, diagnosis }) + styleNote }] });

  try {
    const res = await callGemini({ apiKey, model, systemInstruction: system, contents, mode: "consult" });
    if (!res.ok) return json({ error: res.error || "AIの応答に失敗しました。" });
    // 回答本文と「深掘り候補」を分離する。
    let answer = res.text;
    let suggestions: string[] = [];
    const i = answer.indexOf("<<SUGGEST>>");
    if (i >= 0) {
      const after = answer.slice(i + "<<SUGGEST>>".length);
      answer = answer.slice(0, i).trim();
      suggestions = after
        .split(/\r?\n/)
        .map((l) => l.replace(/^[\s　・･\-*●•‣◦\d.、）)]+/, "").trim())
        .filter((l) => l.length > 0 && l.length <= 40)
        .slice(0, 3);
    }
    return json({ ok: true, answer, suggestions });
  } catch (e: any) {
    return json({ error: "通信エラー: " + (e?.message || e) });
  }
}

function json(o: unknown, s = 200) {
  return new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } });
}
