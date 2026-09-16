import { describe, it, expect } from "vitest";
import { simulate, bizFromCategory, stateFromLevers, BIZ } from "./simulation";

describe("bizFromCategory — キーワード推定", () => {
  it("代表的なカテゴリを正しく分類", () => {
    expect(bizFromCategory("美容室")).toBe("hair");
    expect(bizFromCategory("町中華のラーメン屋")).toBe("restaurant");
    expect(bizFromCategory("整体・マッサージ")).toBe("relax");
    expect(bizFromCategory("居酒屋")).toBe("izakaya");
  });
  it("該当なしは null / 空も null", () => {
    expect(bizFromCategory("宇宙ステーション")).toBeNull();
    expect(bizFromCategory("")).toBeNull();
    expect(bizFromCategory(null)).toBeNull();
  });
});

describe("stateFromLevers — 閾値 S>=72 / M>=48 / W", () => {
  it("各レバーが強/中/弱に変換される", () => {
    expect(stateFromLevers({ display: 80, contact: 50, visit: 30, aio: 75 })).toEqual({
      find: "S", choose: "M", act: "W", ai: "S",
    });
  });
});

describe("simulate", () => {
  it("業種未指定 / DBに無い状態は null", () => {
    expect(simulate("", { display: 100, contact: 100, visit: 100, aio: 100 })).toBeNull();
    expect(simulate("__unknown__", { display: 50, contact: 50, visit: 50, aio: 50 })).toBeNull();
  });

  it("全レバー強(S)なら伸びしろ(lifts)は0・sel=天井・来店率0.75", () => {
    const r = simulate("hair", { display: 100, contact: 100, visit: 100, aio: 100 });
    expect(r).not.toBeNull();
    if (!r) return;
    expect(r.lifts).toHaveLength(0);
    expect(r.sel).toBeGreaterThan(0);
    expect(r.ceiling).toBe(r.sel);
    expect(r.visits).toBe(Math.round(r.sel * 0.75)); // act=S
  });

  it("全レバー弱(W)なら lifts はgain降順・来店率0.4・天井≥sel", () => {
    const r = simulate("hair", { display: 30, contact: 30, visit: 30, aio: 30 });
    expect(r).not.toBeNull();
    if (!r) return;
    expect(r.lifts.length).toBeGreaterThan(0);
    const gains = r.lifts.map((l) => l.gain);
    expect([...gains].sort((a, b) => b - a)).toEqual(gains); // 降順に並んでいる
    expect(r.visits).toBe(Math.round(r.sel * 0.4)); // act=W
    expect(r.ceiling).toBeGreaterThanOrEqual(r.sel);
  });

  it("★・件数の補正で adjusted フラグが立つ", () => {
    const base = simulate("cafe", { display: 55, contact: 55, visit: 55, aio: 55 });
    const adj = simulate("cafe", { display: 55, contact: 55, visit: 55, aio: 55 }, { rating: 4.6, reviews: 250 });
    expect(base?.adjusted).toBe(false);
    expect(adj?.adjusted).toBe(true);
  });

  it("業種リストは12業種", () => {
    expect(BIZ).toHaveLength(12);
  });
});
