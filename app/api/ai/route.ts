// AI診断・相談の窓口。ロジックは lib/ai に委譲する薄いコントローラ。
import { verifyToken } from "@/lib/store/invite";
import { logEvent } from "@/lib/store/tracking";
import { ownerHash, saveDiag } from "@/lib/store/redis";
import {
  buildSystemPrompt,
  buildDiagnoseUserPrompt,
  buildConsultUserPrompt,
  historyToContents,
  callGemini,
  testConnection,
  type GeminiContent,
  type DiagnosePromptInput,
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
  let { key, invite, model = "gemini-2.5-flash", dialect = "std", tone = "polite" } = b || {};
  const { question, diagnosis, background, history, mode, test, weakItems, bizLabel, simInfo } = b || {};

  let apiKey: string | undefined = key;
  let inv: ReturnType<typeof verifyToken> = null;
  if (invite) {
    const v = verifyToken(invite);
    inv = v;
    if (!v) return json({ error: "招待リンクが無効です。担当者にご確認ください。" });
    if (v.expired) return json({ error: "この招待リンクは有効期限が切れています。担当者に新しいリンクを依頼してください。", expired: true });
    apiKey = v.gk;
    if (v.model) model = v.model;
    if (!apiKey) return json({ error: "招待リンクにキーが含まれていません。担当者に新しいリンクを依頼してください。" });
    if (!test) {
      try {
        await logEvent(ownerHash(v.gk), {
          id: v.id,
          label: v.label,
          type: mode === "diagnose" ? "ai_diagnose" : "ai_chat",
          detail: (question || "").slice(0, 80),
        });
      } catch {}
    }
  }
  if (!apiKey) return json({ error: "APIキーが未設定です。設定でGeminiキーを入れてください。" }, 400);

  if (test) {
    const res = await testConnection(key, model);
    return res.ok ? json({ ok: true, model }) : json({ ok: false, error: res.error });
  }

  const system = buildSystemPrompt(dialect, tone);
  const contents: GeminiContent[] = [];

  if (mode === "diagnose") {
    if (!diagnosis) return json({ error: "診断データがありません。" }, 400);
    const uq = buildDiagnoseUserPrompt({ diagnosis, weakItems, background, bizLabel, simInfo } as DiagnosePromptInput);
    contents.push({ role: "user", parts: [{ text: uq }] });
  } else {
    if (!question) return json({ error: "質問が空です。" }, 400);
    for (const c of historyToContents(history)) contents.push(c);
    contents.push({ role: "user", parts: [{ text: buildConsultUserPrompt({ question, diagnosis, background }) }] });
  }

  const res = await callGemini({
    apiKey,
    model,
    systemInstruction: system,
    contents,
    mode: mode === "diagnose" ? "diagnose" : "consult",
  });
  if (!res.ok) return json({ error: res.error });

  // 招待（商談）モードの診断は担当者ダッシュボード用に保存
  if (inv && inv.gk && mode === "diagnose" && res.text) {
    try {
      await saveDiag(ownerHash(inv.gk), inv.id, {
        label: inv.label,
        text: res.text,
        total: diagnosis?.total,
        grade: diagnosis?.grade,
        answers: diagnosis?.answers || [],
        background: background || "",
      });
    } catch {}
  }
  return json({ text: res.text });
}

function json(o: unknown, s = 200) {
  return new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } });
}
