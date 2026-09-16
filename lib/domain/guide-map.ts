// 設問 → ガイド → 相談質問文 のマッピング（純関数）。v1 data.js から移植。
import { GUIDE, type GuideTopic } from "@/content/guide";
import type { DiagItem } from "@/content/diagnosis-items";

const TOPICS: readonly GuideTopic[] = GUIDE;

// 弱点→具体アクション（改善プラン用）
export const ACTIONS: Record<string, string> = {
  category: "業種（カテゴリ）を“いちばん近い1つ”に。追加で提供サービスも補足する",
  basic: "営業時間・電話・住所・お店の説明を最新で正確にする",
  photoCount: "外観・店内・メニューの写真を追加する",
  photoFresh: "新しい写真を1枚でも追加して鮮度を上げる",
  post: "お知らせ（投稿）を1本出す（写真＋ひとこと）",
  rating: "来店体験を高め、クチコミに丁寧に返信する",
  reviewCount: "満足したお客さんが書きやすい雰囲気をつくる",
  reply: "新着のクチコミから、お礼を添えて返信する",
  menu: "主力メニューを値段・ひとことつきで登録する",
  action: "予約リンクやウェブサイトなど、来店の入口を用意する",
};

// 診断の各設問 → 対応するガイド（レバー一致だと別トピックを拾うため固定マップ）
const ITEM_GUIDE: Record<string, string> = {
  category: "basic", basic: "basic", description: "basic", photoCount: "photo", photoFresh: "photo",
  post: "post", reviewCount: "review", reply: "review", menu: "menu",
  action: "action", hp: "citation", sns: "citation",
};

export function guideForItem(it: DiagItem): GuideTopic {
  const g = TOPICS.find((x) => x.key === ITEM_GUIDE[it.k]);
  return g || TOPICS.find((x) => x.levers.some((l) => it.lev.includes(l))) || TOPICS[0];
}

// 弱点項目 → 「うちの場合どう直す？」のAI相談用・質問文
export function consultQuestionFor(it: DiagItem): string {
  const g = guideForItem(it);
  return `診断で「${it.q}」が弱点でした。うちのお店の場合、「${g.title}」を良くするために、今日からできる具体的な最初の一手を3つ、手順つきで教えてください。専門用語は使わず、スマホだけでできる形でお願いします。`;
}

// ガイドのテーマ（AI検索/サイテーション等）を良くする相談質問
export function consultQuestionForTopic(g: GuideTopic): string {
  return `診断で「${g.title}」に伸びしろがありました。うちのお店の場合、「${g.title}」を良くするために、今日からできる具体的な最初の一手を3つ、手順つきで教えてください。専門用語は使わず、スマホだけでできる形でお願いします。`;
}
