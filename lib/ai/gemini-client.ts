// Gemini API 呼び出しの唯一の出入口。v1 api/ai/route.js の fetch 部分を移植。
// サーバー専用。

export interface GeminiContent {
  role: "user" | "model";
  parts: { text: string }[];
}
export type GeminiMode = "diagnose" | "consult";

export type GeminiResult = { ok: true; text: string } | { ok: false; error: string };

const ENDPOINT = (model: string, apiKey: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

export async function callGemini(opts: {
  apiKey: string;
  model: string;
  systemInstruction: string;
  contents: GeminiContent[];
  mode: GeminiMode;
}): Promise<GeminiResult> {
  const { apiKey, model, systemInstruction, contents, mode } = opts;
  const gen: {
    temperature: number;
    maxOutputTokens: number;
    thinkingConfig?: { thinkingBudget: number };
  } = {
    temperature: mode === "diagnose" ? 0.4 : 0.6,
    maxOutputTokens: mode === "diagnose" ? 4000 : 2600,
  };
  // gemini-2.5系は“思考(thinking)”が出力枠を食い、回答が途中で切れることがある→ flashは思考を切って回答に全枠を回す
  if (/flash/i.test(model)) gen.thinkingConfig = { thinkingBudget: 0 };

  const payload = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents,
    generationConfig: gen,
  };
  try {
    const r = await fetch(ENDPOINT(model, apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const d = await r.json();
    if (!r.ok) return { ok: false, error: d?.error?.message || `Gemini APIエラー(${r.status})` };
    const text: string = d?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join("") || "";
    return { ok: true, text: text || "（回答が空でした。モデルやキーをご確認ください）" };
  } catch (e) {
    return { ok: false, error: "通信エラー: " + (e instanceof Error ? e.message : String(e)) };
  }
}

// 設定画面の「接続テスト」。
export async function testConnection(apiKey: string, model: string): Promise<{ ok: boolean; model?: string; error?: string }> {
  try {
    const r = await fetch(ENDPOINT(model, apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "接続テスト。『OK』とだけ返答して。" }] }],
        generationConfig: { maxOutputTokens: 10 },
      }),
    });
    const d = await r.json();
    return r.ok ? { ok: true, model } : { ok: false, error: d?.error?.message || `エラー(${r.status})` };
  } catch {
    return { ok: false, error: "通信エラー" };
  }
}
