// オーナー様のAI相談：slug から公開診断＋営業のcredsを読み、診断コンテキスト付きでGeminiに相談する。
// キー（invite/key）は発行時にサーバ側へ保存されており、クライアントには渡さない。
import { getPublicDiagnosis, recordEvent } from "@/lib/store/diagnosis-store";
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
  recordEvent(slug, "consults").catch(() => {});

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
    "\n\n[会話スタイル・厳守｜コーチング型の一問一答]\n" +
    "・あなたはコーチです。長い説明をせず、短いラリーで対話する。1回の返信は必ず2〜4文まで（箇条書きの羅列はしない）。\n" +
    "・進め方：①まず相手の状況や気持ちを一言で受けとめる（傾聴・承認）→ ②気づきを促す短い質問を1つだけ返す。答えを全部教えず、相手が自分で気づけるよう導く（答えは相手の中にある）。\n" +
    "・質問は毎回1つに絞る。誘導や決めつけはしない。相手の言葉を使って返す。\n" +
    "・ただし『具体的なやり方』を明確に聞かれたら、要点だけ端的に（2〜3文で）答え、最後に短い問いを1つ添えて対話を続ける。\n" +
    "・専門用語は使わず、素人の店主にやさしい言葉で。\n" +
    "・返信の最後に必ず、相手が次に選びやすい短い返答候補を2〜3個、下記の形式だけで付ける（本文には含めない・各12文字程度）:\n" +
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
