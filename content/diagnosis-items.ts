// 診断設問（手入力先行・12問）。v1 data.js DIAG_ITEMS から移植（内容は不改変）。
import type { LeverKey } from "./levers";

/** 単一選択：opts は [ラベル, スコア(0-100)] */
export interface DiagItemSingle {
  k: string;
  q: string;
  opts: readonly (readonly [string, number])[];
  lev: readonly LeverKey[];
  multi?: false;
}

/** 複数選択：opts は [ラベル, ID] */
export interface DiagItemMulti {
  k: string;
  q: string;
  opts: readonly (readonly [string, string])[];
  lev: readonly LeverKey[];
  multi: true;
}

export type DiagItem = DiagItemSingle | DiagItemMulti;

export const DIAG_ITEMS = [
  {
    k: "category",
    q: "業種（カテゴリ）は正しく設定されている？",
    opts: [["ばっちり", 100], ["自信ない", 50], ["未設定/あいまい", 0]],
    lev: ["display", "aio"],
  },
  {
    k: "basic",
    q: "営業時間・電話・住所は最新？",
    opts: [["最新で正確", 100], ["一部古いかも", 50], ["古い/未整備", 0]],
    lev: ["display", "aio"],
  },
  {
    k: "description",
    q: "ビジネスの説明文（お店紹介）は？",
    opts: [["正しくしっかり記載", 100], ["ある程度記載", 65], ["数行程度", 35], ["記載なし", 0]],
    lev: ["aio", "display"],
  },
  {
    k: "photoCount",
    q: "写真の枚数は？",
    opts: [["21枚以上", 100], ["6〜20枚", 55], ["5枚以下", 15]],
    lev: ["display", "contact"],
  },
  {
    k: "photoFresh",
    q: "いちばん新しい写真はいつ頃？",
    opts: [["1ヶ月以内", 100], ["3ヶ月以内", 55], ["半年より前", 15]],
    lev: ["contact"],
  },
  {
    k: "post",
    q: "この1ヶ月にお知らせ（投稿）をした？",
    opts: [["した", 100], ["していない", 0]],
    lev: ["contact"],
  },
  {
    k: "reviewCount",
    q: "クチコミの件数は（同じ業種と比べて）？",
    opts: [["多い方", 100], ["普通", 55], ["少ない", 20]],
    lev: ["display", "contact"],
  },
  {
    k: "reply",
    q: "クチコミへの返信は？",
    opts: [["ほぼ返信", 100], ["たまに", 50], ["ほぼしない", 0]],
    lev: ["contact", "aio"],
  },
  {
    k: "menu",
    q: "メニュー・商品の登録は？",
    opts: [["値段・説明つき", 100], ["一部だけ", 50], ["ない", 0]],
    lev: ["contact", "aio"],
  },
  {
    k: "action",
    q: "予約リンクやウェブサイト（来店の入口）は？",
    opts: [["分かりやすい", 100], ["電話のみ", 45], ["ほぼ無い", 10]],
    lev: ["visit"],
  },
  {
    k: "hp",
    q: "ホームページ（公式サイト）はある？",
    opts: [["ある", 100], ["準備中/制作中", 40], ["ない", 0]],
    lev: ["aio", "display"],
  },
  {
    k: "sns",
    q: "運用中のSNSは？（複数選択可）",
    multi: true,
    opts: [["Instagram", "ig"], ["Facebook", "fb"], ["X", "x"], ["TikTok", "tt"], ["運用なし", "none"]],
    lev: ["contact", "aio"],
  },
] as const satisfies readonly DiagItem[];
