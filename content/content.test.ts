import { describe, it, expect } from "vitest";
import { LEVERS } from "./levers";
import { GLOSSARY } from "./glossary";
import { DIAG_ITEMS } from "./diagnosis-items";
import { GUIDE } from "./guide";

// v1 のコンテンツ量を"正解"として固定する。移植で欠けたら即バレる回帰ガード。
describe("content インベントリ", () => {
  it("集客の4つの力は4つ", () => {
    expect(LEVERS.map((l) => l.k)).toEqual(["display", "contact", "visit", "aio"]);
  });

  it("診断は12問・キーは一意", () => {
    expect(DIAG_ITEMS).toHaveLength(12);
    const keys = DIAG_ITEMS.map((d) => d.k);
    expect(new Set(keys).size).toBe(12);
  });

  it("SNS設問だけが複数選択", () => {
    const multi = DIAG_ITEMS.filter((d) => "multi" in d && d.multi);
    expect(multi.map((m) => m.k)).toEqual(["sns"]);
  });

  it("ガイドは8トピック・キーは一意", () => {
    expect(GUIDE).toHaveLength(8);
    const keys = GUIDE.map((g) => g.key);
    expect(new Set(keys).size).toBe(8);
  });

  it("各ガイドは手順とコツを持つ", () => {
    for (const g of GUIDE) {
      expect(g.steps.length).toBeGreaterThan(0);
      expect(g.tips.length).toBeGreaterThan(0);
    }
  });

  it("用語集は主要6語を含む", () => {
    expect(Object.keys(GLOSSARY)).toEqual(
      expect.arrayContaining(["GBP", "カテゴリ", "NAP", "AI検索", "オーナー確認", "投稿"]),
    );
  });
});
