// サイテーション精査：店名＋公式サイト/他媒体を Gemini(Google検索グラウンディング) で確認し、
// NAP一致・掲載媒体・SNS活用の「採点案」を返す。最終採点は営業が微調整する（案に過ぎない）。
import { verifyToken } from "@/lib/store/invite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// AIの返す levelを、diagnosis-v3 のサブ選択肢スコアに写像する。
const NAP: Record<string, number> = { match: 100, partial: 50, mismatch: 0 };
const SNS: Record<string, number> = { active: 100, exists: 40, none: 0 };
function mediaScore(count: number): number {
  if (count >= 3) return 100;
  if (count >= 1) return 55;
  return 0;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function POST(request: Request) {
  let b: any;
  try {
    b = await request.json();
  } catch {
    return json({ error: "不正なリクエスト" }, 400);
  }
  let { key, invite, model = "gemini-2.5-flash", storeName, site, others } = b || {};
  let apiKey: string | undefined = key;
  if (invite) {
    const v = verifyToken(invite);
    if (!v || v.expired) return json({ error: "招待リンクが無効か期限切れです。" });
    apiKey = v.gk;
    if (v.model) model = v.model;
  }
  if (!storeName || !String(storeName).trim()) return json({ error: "店舗名が必要です。" }, 400);
  // サーバー共通キー（Vercel環境変数）へフォールバック。
  if (!apiKey) apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
  // それでも無ければ手入力にフォールバック（UIはチップで手動採点できる）
  if (!apiKey) return json({ manual: true, note: "Geminiキーが未設定のため、手入力で採点してください。" });

  const prompt =
    `あなたは店舗リサーチ担当です。次のお店の「外部サイトでの掲載状況」を Google検索で確認してください。\n` +
    `店名: ${storeName}\n公式サイト/LP: ${site || "(不明)"}\n他媒体/SNS: ${others || "(不明)"}\n\n` +
    `確認する3点:\n` +
    `1) NAP一致: 店名・住所・電話が、Googleビジネスプロフィールと公式サイト/各媒体で一致しているか。\n` +
    `2) 掲載媒体数: 食べログ/ホットペッパー/エキテン等ポータルや公式サイトなど、実在が確認できる掲載媒体の数。\n` +
    `3) SNS活用: 公式SNSが直近も更新されているか（更新継続/開設のみ/なし）。\n\n` +
    `【捏造禁止】検索結果に実際に出ている情報だけを使う。不明は控えめに（napは"partial"、snsは"exists"を既定に）。\n` +
    `次の形のJSONだけを返す（説明・コードフェンス不要）:\n` +
    `{"nap":"match|partial|mismatch","mediaCount":整数,"sns":"active|exists|none","tags":["短い所見1","短い所見2"],"note":"一文の所見"}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const gen: any = { temperature: 0, maxOutputTokens: 800 };
  if (/flash/i.test(model)) gen.thinkingConfig = { thinkingBudget: 0 };
  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    tools: [{ google_search: {} }],
    generationConfig: gen,
  };
  try {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const d = await r.json();
    if (!r.ok) return json({ error: d?.error?.message || `検索エラー(${r.status})` });
    let text: string = d?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || "";
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return json({ manual: true, note: "うまく取得できませんでした。手入力で採点してください。" });
    let info: any;
    try {
      info = JSON.parse(m[0]);
    } catch {
      return json({ manual: true, note: "解析に失敗しました。手入力で採点してください。" });
    }
    const mediaCount = Math.max(0, Number(info.mediaCount) || 0);
    const scores = {
      nap: NAP[info.nap] ?? 50,
      media: mediaScore(mediaCount),
      sns: SNS[info.sns] ?? 40,
    };
    const tags = Array.isArray(info.tags) ? info.tags.slice(0, 3).map(String) : [];
    return json({ ok: true, scores, tags, note: String(info.note || ""), mediaCount });
  } catch (e: any) {
    return json({ error: "通信エラー: " + (e?.message || e) });
  }
}

function json(o: unknown, s = 200) {
  return new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } });
}
