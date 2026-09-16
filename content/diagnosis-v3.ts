// V3 診断の項目定義（カンリー基準の5カテゴリ）。純データ・Reactを import しない。
// この定義が「営業モードの入力選択肢」と「採点基準×現状の照らし合わせ」の唯一の源になる。
// 配点(max)＝カンリーAIスコア基準：プロフィール30/写真15/クチコミ20/投稿15/サイテーション20＝100。

export type CategoryKey = "profile" | "photo" | "review" | "post" | "citation";

/** サブ項目の選択肢。score は 0〜100（サブ内の達成度）。 */
export interface DiagSubOption {
  readonly label: string;
  readonly score: number;
}

/** サブ項目（採点基準の1行＝入力1つ）。 */
export interface DiagSub {
  readonly key: string;
  readonly label: string;
  /** カテゴリ内での重み（既定1）。 */
  readonly weight?: number;
  /** 採点基準の説明（満点条件など）。詳細シートの「基準：」に使う。 */
  readonly criteria: string;
  /** 営業が選ぶ選択肢＝現状。 */
  readonly options: readonly DiagSubOption[];
  /** サイテーションのようにAIが精査して採点案を出すサブか。 */
  readonly aiAssisted?: boolean;
}

/** カテゴリ（5項目）。max が配点＝既定の重み。 */
export interface DiagCategory {
  readonly key: CategoryKey;
  readonly name: string;
  readonly max: number;
  readonly subs: readonly DiagSub[];
}

export const DIAG_CATEGORIES: readonly DiagCategory[] = [
  {
    key: "profile",
    name: "プロフィール",
    max: 30,
    subs: [
      { key: "category", label: "カテゴリ設定", criteria: "主+副で正確",
        options: [{ label: "主+副で正確", score: 100 }, { label: "主のみ", score: 60 }, { label: "未設定/あいまい", score: 0 }] },
      { key: "menu", label: "メニュー・商品", criteria: "写真・説明つきで充実",
        options: [{ label: "充実", score: 100 }, { label: "一部のみ", score: 50 }, { label: "ない", score: 0 }] },
      { key: "reservation", label: "予約ボタン", criteria: "設定あり",
        options: [{ label: "あり", score: 100 }, { label: "なし", score: 0 }] },
      { key: "link", label: "リンク設定", criteria: "Web＋SNS",
        options: [{ label: "Web＋SNS", score: 100 }, { label: "Webのみ", score: 50 }, { label: "なし", score: 0 }] },
    ],
  },
  {
    key: "photo",
    name: "写真",
    max: 15,
    subs: [
      { key: "count", label: "総枚数", criteria: "21枚以上",
        options: [{ label: "21枚以上", score: 100 }, { label: "6〜20枚", score: 55 }, { label: "5枚以下", score: 15 }] },
      { key: "ownerPhotos", label: "オーナー提供枚数", criteria: "十分にある",
        options: [{ label: "十分にある", score: 100 }, { label: "普通", score: 55 }, { label: "少ない", score: 15 }] },
      { key: "fresh", label: "最新写真", criteria: "1ヶ月以内",
        options: [{ label: "1ヶ月以内", score: 100 }, { label: "3ヶ月以内", score: 55 }, { label: "半年より前", score: 15 }] },
    ],
  },
  {
    key: "review",
    name: "クチコミ・返信",
    max: 20,
    subs: [
      { key: "count", label: "件数", criteria: "同業より多い",
        options: [{ label: "多い", score: 100 }, { label: "普通", score: 55 }, { label: "少ない", score: 20 }] },
      { key: "rating", label: "評価", criteria: "★4.0以上",
        options: [{ label: "★4.5以上", score: 100 }, { label: "★4.0以上", score: 80 }, { label: "★3.5以上", score: 55 }, { label: "★3.5未満", score: 30 }] },
      { key: "latest", label: "最新クチコミ", criteria: "1ヶ月以内",
        options: [{ label: "1ヶ月以内", score: 100 }, { label: "3ヶ月以内", score: 55 }, { label: "半年より前", score: 15 }] },
      { key: "reply", label: "返信率", criteria: "ほぼ返信",
        options: [{ label: "ほぼ返信", score: 100 }, { label: "たまに", score: 50 }, { label: "ほぼしない", score: 0 }] },
    ],
  },
  {
    key: "post",
    name: "新着投稿",
    max: 15,
    subs: [
      { key: "count", label: "投稿数（直近1ヶ月）", criteria: "週2回以上",
        options: [{ label: "週2回以上", score: 100 }, { label: "週1回", score: 60 }, { label: "月数回", score: 30 }, { label: "ほぼなし", score: 0 }] },
      { key: "continuity", label: "継続性", criteria: "週2回以上を継続",
        options: [{ label: "継続している", score: 100 }, { label: "波がある", score: 50 }, { label: "止まっている", score: 0 }] },
    ],
  },
  {
    key: "citation",
    name: "サイテーション",
    max: 20,
    subs: [
      { key: "nap", label: "情報の一致（NAP）", criteria: "全媒体で店名・住所・電話が一致", aiAssisted: true,
        options: [{ label: "全媒体で一致", score: 100 }, { label: "一部で相違あり", score: 50 }, { label: "相違が多い", score: 0 }] },
      { key: "media", label: "掲載媒体", criteria: "3媒体以上に掲載", aiAssisted: true,
        options: [{ label: "3媒体以上", score: 100 }, { label: "1〜2媒体", score: 55 }, { label: "なし", score: 0 }] },
      { key: "sns", label: "SNS活用", criteria: "更新を継続", aiAssisted: true,
        options: [{ label: "更新を継続", score: 100 }, { label: "開設のみ", score: 40 }, { label: "なし", score: 0 }] },
    ],
  },
] as const;

/** 既定の配点（重み）。管理画面で上書き可能にする際の初期値。 */
export const DEFAULT_WEIGHTS: Record<CategoryKey, number> = {
  profile: 30, photo: 15, review: 20, post: 15, citation: 20,
};

export const TOTAL_MAX = 100;
