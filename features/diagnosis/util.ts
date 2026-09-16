import type { BgInfo } from "@/state/persistence";

// 診断に渡す背景（＝検索で取れる収集情報）を1行に整形。v1 fmtBg を移植。
export function fmtBg(info: BgInfo, fallbackName?: string): string {
  return (
    `店名:${info.name || fallbackName || "—"} / 業種(カテゴリ):${info.category || "不明"} / ` +
    `クチコミ点数:${info.rating ?? "不明"} / クチコミ数:${info.reviewCount ?? "不明"}` +
    (info.area ? ` / エリア:${info.area}` : "")
  );
}
