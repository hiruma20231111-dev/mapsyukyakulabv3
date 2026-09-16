import { describe, it, expect } from "vitest";
import { scoreV3, rankOf, type V3Answers } from "./score";

describe("rankOf", () => {
  it("S/A/B/C/D の境界", () => {
    expect(rankOf(100)).toBe("S");
    expect(rankOf(90)).toBe("S");
    expect(rankOf(89)).toBe("A");
    expect(rankOf(80)).toBe("A");
    expect(rankOf(79)).toBe("B");
    expect(rankOf(70)).toBe("B");
    expect(rankOf(69)).toBe("C");
    expect(rankOf(55)).toBe("C");
    expect(rankOf(54)).toBe("D");
    expect(rankOf(0)).toBe("D");
  });
});

const full: V3Answers = {
  profile: { category: 100, menu: 100, reservation: 100, link: 100 },
  photo: { count: 100, ownerPhotos: 100, fresh: 100 },
  review: { count: 100, rating: 100, latest: 100, reply: 100 },
  post: { count: 100, continuity: 100 },
  citation: { nap: 100, media: 100, sns: 100 },
};

describe("scoreV3 — 満点", () => {
  const r = scoreV3(full);
  it("各カテゴリが配点満点・総合100・ランクS・余地0", () => {
    expect(r.categories.map((c) => c.points)).toEqual([30, 15, 20, 15, 20]);
    expect(r.total).toBe(100);
    expect(r.max).toBe(100);
    expect(r.rank).toBe("S");
    expect(r.headroom).toBe(0);
    expect(r.categories.every((c) => c.tier === 5)).toBe(true);
  });
});

describe("scoreV3 — 全0/未回答", () => {
  it("総合0・ランクD・全カテゴリ empty", () => {
    const r = scoreV3({});
    expect(r.total).toBe(0);
    expect(r.rank).toBe("D");
    expect(r.headroom).toBe(100);
    expect(r.categories.every((c) => c.empty)).toBe(true);
    expect(r.categories.every((c) => c.points === 0)).toBe(true);
  });
});

describe("scoreV3 — 混在（手計算で固定）", () => {
  // profile [100,50,0,50]=50% → 15 / photo [55,55,55]=55% → 8 /
  // review [55,80,55,50]=60% → 12 / post [100,50]=75% → 11 / citation [50,100,40]=63.33% → 13
  const answers: V3Answers = {
    profile: { category: 100, menu: 50, reservation: 0, link: 50 },
    photo: { count: 55, ownerPhotos: 55, fresh: 55 },
    review: { count: 55, rating: 80, latest: 55, reply: 50 },
    post: { count: 100, continuity: 50 },
    citation: { nap: 50, media: 100, sns: 40 },
  };
  const r = scoreV3(answers);
  it("各カテゴリ点", () => {
    const pts = Object.fromEntries(r.categories.map((c) => [c.key, c.points]));
    expect(pts).toEqual({ profile: 15, photo: 8, review: 12, post: 11, citation: 13 });
  });
  it("総合59・ランクC", () => {
    expect(r.total).toBe(59);
    expect(r.rank).toBe("C");
  });
  it("改善の余地＝配点-得点", () => {
    const hr = Object.fromEntries(r.categories.map((c) => [c.key, c.headroom]));
    expect(hr).toEqual({ profile: 15, photo: 7, review: 8, post: 4, citation: 7 });
  });
});

describe("scoreV3 — 未回答サブは平均から除外", () => {
  it("回答済みサブだけで比率を出す", () => {
    // profile: category=100 のみ回答 → 100% → 30点
    const r = scoreV3({ profile: { category: 100 } });
    const profile = r.categories.find((c) => c.key === "profile")!;
    expect(profile.points).toBe(30);
    expect(profile.empty).toBe(false);
  });
});

describe("scoreV3 — 配点の上書き（管理画面用）", () => {
  it("weights でカテゴリ配点を変えられる", () => {
    const r = scoreV3(full, { profile: 40, photo: 5 });
    const pts = Object.fromEntries(r.categories.map((c) => [c.key, c.max]));
    expect(pts.profile).toBe(40);
    expect(pts.photo).toBe(5);
    // 満点なので points=max
    expect(r.categories.find((c) => c.key === "profile")!.points).toBe(40);
  });
});
