import { describe, it, expect } from "vitest";
import { diagnose, snsScore, improvementItems, type Answers } from "./diagnose";

// v1 の採点挙動を"正解"として固定する。移植・リファクタで1点でもズレたら即失敗する回帰ガード。

describe("snsScore", () => {
  it("3つ以上=100 / 2つ=75 / 1つ=50 / なし・空=15 / 非配列=null", () => {
    expect(snsScore(["ig", "fb", "x"])).toBe(100);
    expect(snsScore(["ig", "fb"])).toBe(75);
    expect(snsScore(["ig"])).toBe(50);
    expect(snsScore(["none"])).toBe(15);
    expect(snsScore([])).toBe(15);
    expect(snsScore(null)).toBeNull();
    expect(snsScore("x")).toBeNull();
  });
});

describe("diagnose — 満点", () => {
  const answers: Answers = {
    category: 100, basic: 100, description: 100, photoCount: 100, photoFresh: 100,
    post: 100, reviewCount: 100, reply: 100, menu: 100, action: 100, hp: 100,
    sns: ["ig", "fb", "x"],
  };
  it("全レバー100・総合100・グレードA", () => {
    const r = diagnose(answers);
    expect(r.levers).toEqual({ display: 100, contact: 100, visit: 100, aio: 100 });
    expect(r.total).toBe(100);
    expect(r.grade).toBe("A");
  });
});

describe("diagnose — 混在（手計算値で固定）", () => {
  // display平均=47 / contact=40 / visit=45 / aio=51 / 総合=46 / D
  const answers: Answers = {
    category: 0, basic: 100, description: 65, photoCount: 55, photoFresh: 55,
    post: 0, reviewCount: 20, reply: 50, menu: 50, action: 45, hp: 40,
    sns: ["ig"], // snsScore=50
  };
  const r = diagnose(answers);

  it("レバー平均が手計算と一致", () => {
    expect(r.levers).toEqual({ display: 47, contact: 40, visit: 45, aio: 51 });
  });
  it("総合46・グレードD", () => {
    expect(r.total).toBe(46);
    expect(r.grade).toBe("D");
  });
  it("弱点トップ3（同点は設問順）= category, post, reviewCount", () => {
    expect(r.weak.map((it) => it.k)).toEqual(["category", "post", "reviewCount"]);
  });
  it("改善候補(<72)を低い順に6件", () => {
    expect(improvementItems(answers).map((it) => it.k)).toEqual([
      "category", "post", "reviewCount", "hp", "action", "reply",
    ]);
  });
});

describe("diagnose — 未回答は無視", () => {
  it("回答が空なら total=0 / grade=D / levers全null", () => {
    const r = diagnose({});
    expect(r.total).toBe(0);
    expect(r.grade).toBe("D");
    expect(r.levers).toEqual({ display: null, contact: null, visit: null, aio: null });
    expect(r.weak).toEqual([]);
  });
});
