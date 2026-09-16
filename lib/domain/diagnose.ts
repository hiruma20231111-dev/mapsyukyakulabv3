// 診断の採点ロジック（純関数・Reactなし）。v1 data.js から移植（挙動は不変）。
import { LEVERS, type LeverKey } from "@/content/levers";
import { DIAG_ITEMS, type DiagItem } from "@/content/diagnosis-items";

// `as const` の超厳密なリテラル型を、扱いやすい共通型に一段ゆるめたビュー。
const ITEMS: readonly DiagItem[] = DIAG_ITEMS;

/** 設問の回答: 単一選択=スコア数値 / 複数選択(SNS)=ID配列 */
export type Answers = Record<string, number | string[] | null | undefined>;

export type Grade = "A" | "B" | "C" | "D";

export interface DiagnoseResult {
  levers: Record<LeverKey, number | null>;
  total: number;
  grade: Grade;
  weak: DiagItem[];
}

/** 複数選択(SNS)の配列 → スコア（運用の“面”の広さ＝非構造化サイテーション/接触） */
export function snsScore(arr: unknown): number | null {
  if (!Array.isArray(arr)) return null;
  const sel = arr.filter((x) => x !== "none");
  if (arr.includes("none") || sel.length === 0) return 15;
  return sel.length >= 3 ? 100 : sel.length === 2 ? 75 : 50;
}

/** 1設問の実効スコア（未回答は null） */
function scoreOf(it: DiagItem, answers: Answers): number | null {
  const v = answers[it.k];
  if (v == null) return null;
  if ("multi" in it && it.multi) return snsScore(v);
  return typeof v === "number" ? v : null;
}

export function diagnose(answers: Answers): DiagnoseResult {
  const acc: Record<LeverKey, number[]> = { display: [], contact: [], visit: [], aio: [] };
  for (const it of ITEMS) {
    const v = scoreOf(it, answers);
    if (typeof v !== "number") continue;
    for (const L of it.lev) acc[L].push(v);
  }
  const levers = {} as Record<LeverKey, number | null>;
  for (const L of LEVERS) {
    const arr = acc[L.k];
    levers[L.k] = arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
  }
  const vals = LEVERS.map((l) => levers[l.k]).filter((x): x is number => x != null);
  const total = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  const grade: Grade = total >= 80 ? "A" : total >= 65 ? "B" : total >= 50 ? "C" : "D";
  const weak = ITEMS
    .filter((it) => answers[it.k] != null)
    .map((it) => ({ it, v: scoreOf(it, answers) }))
    .filter((x): x is { it: DiagItem; v: number } => typeof x.v === "number")
    .sort((a, b) => a.v - b.v)
    .slice(0, 3)
    .map(({ it }) => it);
  return { levers, total, grade, weak };
}

/** 「足りていないこと」＝スコアが“強い(72)”未満の項目を、効きやすい順（低い順）に返す */
export function improvementItems(answers: Answers, limit = 6): DiagItem[] {
  return ITEMS
    .filter((it) => answers[it.k] != null)
    .map((it) => ({ it, v: scoreOf(it, answers) }))
    .filter((x): x is { it: DiagItem; v: number } => typeof x.v === "number" && x.v < 72)
    .sort((a, b) => a.v - b.v)
    .slice(0, limit)
    .map((x) => x.it);
}
