import { describe, it, expect } from "vitest";
import {
  LS, loadPersisted, defaultState, cleanLegacyBg,
  saveCfg, saveBackground, saveBgInfo, saveAnswers, saveAiDiag,
  saveInvite, saveAdvisorSetup, saveReadGuides, saveBiz, saveFs,
  type KVStorage,
} from "./persistence";

class MemStorage implements KVStorage {
  map = new Map<string, string>();
  getItem(k: string) { return this.map.has(k) ? this.map.get(k)! : null; }
  setItem(k: string, v: string) { this.map.set(k, v); }
  removeItem(k: string) { this.map.delete(k); }
}

describe("persistence — v1互換キー", () => {
  it("空ストレージは既定値を返す", () => {
    const s = new MemStorage();
    expect(loadPersisted(s)).toEqual(defaultState());
  });

  it("保存→復元でラウンドトリップ（キー名・値の形もv1準拠）", () => {
    const s = new MemStorage();
    saveCfg(s, { key: "AIzaX", model: "gemini-2.5-pro", dialect: "kansai", tone: "frank" });
    saveBackground(s, "店名:テスト / 業種:美容室");
    saveBgInfo(s, { name: "テスト", category: "美容室", rating: 4.2, reviewCount: 128 });
    saveAnswers(s, { category: 100, sns: ["ig", "fb"] });
    saveAiDiag(s, "## 総評\nいい感じ");
    saveInvite(s, "tok.tok.tok");
    saveAdvisorSetup(s, true);
    saveReadGuides(s, { basic: true });
    saveBiz(s, "hair");
    saveFs(s, 1.18);

    // 生キーの確認（v1と同一）
    expect(s.getItem("ml_key")).toBe("AIzaX");
    expect(s.getItem("ml_dialect")).toBe("kansai");
    expect(s.getItem("ml_advisor_setup")).toBe("1");
    expect(s.getItem("ml_fs")).toBe("1.18");
    expect(s.getItem(LS.answers)).toBe(JSON.stringify({ category: 100, sns: ["ig", "fb"] }));

    // 復元
    const st = loadPersisted(s);
    expect(st.cfg).toEqual({ key: "AIzaX", model: "gemini-2.5-pro", dialect: "kansai", tone: "frank" });
    expect(st.background).toBe("店名:テスト / 業種:美容室");
    expect(st.bgInfo).toEqual({ name: "テスト", category: "美容室", rating: 4.2, reviewCount: 128 });
    expect(st.answers).toEqual({ category: 100, sns: ["ig", "fb"] });
    expect(st.aiDiagText).toBe("## 総評\nいい感じ");
    expect(st.invite).toBe("tok.tok.tok");
    expect(st.advisorSetup).toBe(true);
    expect(st.readGuides).toEqual({ basic: true });
    expect(st.biz).toBe("hair");
    expect(st.fs).toBe(1.18);
  });

  it("空の答えは保存しない / falseフラグ・空背景は消す", () => {
    const s = new MemStorage();
    saveAnswers(s, {});
    expect(s.getItem(LS.answers)).toBeNull();
    saveAdvisorSetup(s, true);
    saveAdvisorSetup(s, false);
    expect(s.getItem(LS.advisorSetup)).toBeNull();
    saveBackground(s, "x");
    saveBackground(s, "");
    expect(s.getItem(LS.bg)).toBeNull();
  });

  it("旧背景の不要セグメントを除去", () => {
    const raw = "店名:テスト / 業種:美容室 / サイト:あり / 予約:あり / ビジネス説明文:長文 / 投稿(最新情報):あり";
    expect(cleanLegacyBg(raw)).toBe("店名:テスト / 業種:美容室");
  });
});
