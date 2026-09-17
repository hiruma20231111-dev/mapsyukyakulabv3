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

  // これまでの質問回数（このリクエストが何往復目か）。3往復目あたりで一旦まとめる。
  const userTurns = history.filter((h) => h.role === "user").length;
  const shouldWrap = userTurns >= 2;

  const base =
    "\n\n[会話スタイル・厳守｜MEOコーチング]\n" +
    "・あなたは店主に伴走するMEOコーチ。共感で終わらせず、必ず“中身”を入れる。全体を短く端的に。\n" +
    "・回答は必ず次の3部構成にする（各部を短く・改行で区切る）：\n" +
    "  ①共感（2行）：相手の気持ちや状況を短く受けとめる。\n" +
    "  ②伝えたいこと（3〜4行）：お客様視点（見つける→選ぶ→来店する流れ）とGoogle視点（お店との“合致度・近さ・知られている度合い”→地図/検索の順位、一般的傾向）で、それを整えると何が良くなるかを簡潔に。\n" +
    "  ③次へ（2〜3行）：気づきを促す短い質問を1つ。ただし『まとめの番』のときは結論を短く。\n" +
    "・特に『Googleの評価が上がる』『お客様に見つかる・認知される』につながる“強く伝えたい要点”だけを、**アスタリスク2つで囲んで**強調する（強調は多用しない・1〜2箇所まで）。\n" +
    "・専門用語は使わない。断定・成果保証はしない。\n";

  const wrapNote = shouldWrap
    ? "・【今回はまとめる番】ここまでの話を2〜3文で結論としてまとめ、次の一歩を一言で示す。最後に『この件をもっと詳しく知りたいか、それとも次の対策に進むか』を尋ねる。\n"
    : "";

  const suggestNote = shouldWrap
    ? "・返信の最後に、下記の形式だけで候補を付ける（本文に含めない）。候補は「もっと詳しく」「次の対策に進む」に沿った2〜3個にする:\n<<SUGGEST>>\n・もっと詳しく知りたい\n・次の対策に進む\n・（任意でもう1つ）"
    : "・返信の最後に、相手が次に選びやすい短い返答候補を2〜3個、下記の形式だけで付ける（本文に含めない・各12文字程度）:\n<<SUGGEST>>\n・（候補1）\n・（候補2）\n・（候補3）";

  const styleNote = base + wrapNote + suggestNote;

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
