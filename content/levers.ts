// 集客の4つの力（レバー）。v1 data.js から移植（内容は不改変）。
// display=見つかる / contact=選ばれる / visit=行動(来店) / aio=AI検索

export type LeverKey = "display" | "contact" | "visit" | "aio";

export interface Lever {
  k: LeverKey;
  nm: string;
  ds: string;
}

export const LEVERS = [
  { k: "display", nm: "見つかる", ds: "検索/地図に出る" },
  { k: "contact", nm: "選ばれる", ds: "気になる・比較" },
  { k: "visit", nm: "行動", ds: "来店・予約" },
  { k: "aio", nm: "AI検索", ds: "AIのおすすめ" },
] as const satisfies readonly Lever[];

export const SUCCESS_MODEL =
  "Googleマップでお客さんが来る流れは、【見つかる → 選ばれる → 行動（来店・予約）】。" +
  "最近は“AIのおすすめ検索”も新しい入口になっています。各改善が、この4つのどれを強めるかで効果を考えます。";
