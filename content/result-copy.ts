// 診断結果ページの編集コピー（評価フェーズ／素人向け）。純データ。
// 00_AI憲法・10_診断コンサル憲法に従う：診断＝"評価"（できている/足りない/直すとどうなるか）。
// 具体的な手順は「相談」フェーズへ。専門用語NG・成果断定しない。
import type { CategoryKey } from "./diagnosis-v3";

export interface CategoryCopy {
  /** 一覧行の短い注記。 */
  note: string;
  /** 評価コメント（1〜2文）。 */
  comment: string;
  /** AIの気づき（詳細シート）。 */
  insight: string;
}

export const RESULT_COPY: Record<CategoryKey, CategoryCopy> = {
  profile: {
    note: "予約ボタンなど一部が未設定",
    comment: "基本情報は整っています。予約ボタンが未設定です。",
    insight: "予約ボタンは“来店”に直結します。「今すぐ予約したい人」を取りこぼしやすい状態です。",
  },
  photo: {
    note: "枚数が少なめ",
    comment: "写真が少なく、お店の雰囲気が伝わりにくい状態です。",
    insight: "写真は「選ばれる前の第一印象」。オーナー様が用意した写真ほど信頼につながります。",
  },
  review: {
    note: "評価は高い。返信は「たまに」",
    comment: "件数・評価は良好です。返信が「たまに」になっています。",
    insight: "返信は他のお客様も見ています。丁寧な返信は“選ばれる力”をそのまま強めます。",
  },
  post: {
    note: "投稿がほぼ止まっている",
    comment: "投稿がほぼ止まっています。",
    insight: "投稿は「動いているお店」のサイン。止まると新鮮さが伝わりにくくなります。",
  },
  citation: {
    note: "掲載情報に相違あり",
    comment: "HPとGBPで店舗情報（住所など）が食い違っています。",
    insight: "店名・住所・電話が各サイトでそろうと、AI検索でも同じお店だと認識されやすくなります。",
  },
};

/** ランク → 総評（評価フェーズ・断定しない）。 */
export function verdictOf(rank: "S" | "A" | "B" | "C" | "D"): string {
  switch (rank) {
    case "S":
    case "A":
      return "土台がしっかり整っています。今の運用を続けながら、弱い部分を足すだけで、さらに見つかりやすくなります。";
    case "B":
      return "土台はできています。あと少し「発信・運用」を足すと、見つかる・選ばれる力がぐっと伸びます。";
    default:
      return "土台はできています。ただGoogle上の「発信・運用」が止まっている状態。ここを動かせば見え方は大きく変わります。";
  }
}
