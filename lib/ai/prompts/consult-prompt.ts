// 相談モードのユーザープロンプト＋履歴→contents 変換。v1 api/ai/route.js の else 分岐を移植。
import type { GeminiContent } from "../gemini-client";

export interface ConsultDiagnosis {
  total: number;
  grade: string;
  weak: string[];
}
export interface ConsultPromptInput {
  question: string;
  diagnosis?: ConsultDiagnosis | null;
  background?: string;
}

export function buildConsultUserPrompt({ question, diagnosis, background }: ConsultPromptInput): string {
  let uq = question;
  if (diagnosis) uq += `\n\n[このユーザーの簡易セルフ診断] 総合${diagnosis.total}点(${diagnosis.grade}) 弱点:${(diagnosis.weak || []).join(" / ")}`;
  if (background) uq += `\n[予備知識(参考値)] ${background}`;
  return uq;
}

export interface HistoryTurn {
  role: string;
  text: string;
}

// 直近6ターンを Gemini contents に変換（各1500字まで）
export function historyToContents(history?: HistoryTurn[]): GeminiContent[] {
  if (!Array.isArray(history)) return [];
  return history.slice(-6).map((h) => ({
    role: h.role === "user" ? "user" : "model",
    parts: [{ text: String(h.text || "").slice(0, 1500) }],
  }));
}
