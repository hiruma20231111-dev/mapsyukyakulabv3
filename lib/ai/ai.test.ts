import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "./system";
import { buildDiagnoseUserPrompt } from "./prompts/diagnose-prompt";
import { buildConsultUserPrompt, historyToContents } from "./prompts/consult-prompt";

describe("buildSystemPrompt", () => {
  it("憲法・知識パック・口調が全部入る", () => {
    const s = buildSystemPrompt("kansai", "frank");
    expect(s).toContain("第1条 グラウンディング");
    expect(s).toContain("第8条");
    expect(s).toContain("知識パック(公開安全)");
    expect(s).toContain("Ask Maps");
    expect(s).toContain("関西弁");
    expect(s).toContain("フランク");
  });
  it("未知の方言・トーンは標準にフォールバック", () => {
    const s = buildSystemPrompt("unknown", "unknown");
    expect(s).toContain("標準語");
    expect(s).toContain("丁寧");
  });
});

describe("buildDiagnoseUserPrompt", () => {
  const base = buildDiagnoseUserPrompt({
    diagnosis: {
      total: 46,
      grade: "D",
      levers: { display: 47, contact: 40, visit: 45, aio: 51 },
      answers: [{ q: "クチコミへの返信は？", label: "たまに" }],
    },
    weakItems: [{ k: "reply", q: "クチコミへの返信は？" }],
    background: "店名:テスト / 業種:美容室",
    bizLabel: "美容室",
    simInfo: { bizLabel: "美容室", sel: 120, visits: 70, ceiling: 200, lifts: [{ lever: "選ばれる", gain: 20, items: ["写真"] }] },
  });

  it("4つの力の強弱ラベルが正しい", () => {
    expect(base).toContain("見つかる:弱い(伸びしろ)"); // 47
    expect(base).toContain("AI検索:ふつう"); // 51
  });
  it("弱点リスト・@@FIX@@・@@RIVAL・セクション見出しを含む", () => {
    expect(base).toContain("- key=reply ｜ クチコミへの返信は？");
    expect(base).toContain("@@FIX:aio@@");
    expect(base).toContain("@@FIX:citation@@");
    expect(base).toContain("@@RIVAL:<本文>@@");
    expect(base).toContain("## 🩺 総評");
  });
  it("背景・シミュ・業種が反映される", () => {
    expect(base).toContain("【収集情報(AIがGBP/Web検索で取得した5項目・参考値)】");
    expect(base).toContain("選択120人→来店70人");
    expect(base).toContain("美容室で、");
  });
  it("背景なし・弱点なしのときは該当ブロックが出ない", () => {
    const bare = buildDiagnoseUserPrompt({
      diagnosis: { total: 80, grade: "A", levers: { display: 80, contact: 80, visit: 80, aio: 80 }, answers: [] },
    });
    expect(bare).not.toContain("【収集情報");
    expect(bare).not.toContain("- key=reply"); // 弱点リスト（対象項目）ブロックは出ない
    expect(bare).toContain("@@FIX:aio@@"); // 固定セクションの印は常に出る
  });
});

describe("buildConsultUserPrompt / historyToContents", () => {
  it("質問＋診断＋背景を連結", () => {
    const uq = buildConsultUserPrompt({
      question: "写真は何枚必要？",
      diagnosis: { total: 60, grade: "C", weak: ["写真", "投稿"] },
      background: "店名:テスト",
    });
    expect(uq).toContain("写真は何枚必要？");
    expect(uq).toContain("総合60点(C)");
    expect(uq).toContain("弱点:写真 / 投稿");
    expect(uq).toContain("[予備知識(参考値)] 店名:テスト");
  });
  it("履歴は直近6件・role変換・1500字制限", () => {
    const hist = Array.from({ length: 10 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", text: "x".repeat(2000) }));
    const c = historyToContents(hist);
    expect(c).toHaveLength(6);
    expect(c[0].parts[0].text.length).toBe(1500);
    expect(["user", "model"]).toContain(c[0].role);
  });
});
