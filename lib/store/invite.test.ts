import { describe, it, expect } from "vitest";
import { mintToken, verifyToken } from "./invite";

describe("招待トークン（AES-256-GCM）", () => {
  it("mint→verify で中身が復元でき、有効", () => {
    const token = mintToken({ geminiKey: "AIza-TEST-KEY", label: "テスト店舗", days: 14, model: "gemini-2.5-flash" });
    const v = verifyToken(token);
    expect(v).not.toBeNull();
    expect(v?.valid).toBe(true);
    expect(v?.expired).toBe(false);
    expect(v?.gk).toBe("AIza-TEST-KEY");
    expect(v?.label).toBe("テスト店舗");
    expect(v?.model).toBe("gemini-2.5-flash");
    expect(typeof v?.id).toBe("string");
  });

  it("不正な形式は null", () => {
    expect(verifyToken("")).toBeNull();
    expect(verifyToken("not-a-token")).toBeNull();
    expect(verifyToken(null)).toBeNull();
    expect(verifyToken("a.b")).toBeNull(); // 3分割でない
  });

  it("改ざんされたトークンは復号に失敗して null", () => {
    const token = mintToken({ geminiKey: "AIza-TEST-KEY" });
    const [iv, tag, enc] = token.split(".");
    const tampered = [iv, tag, enc.slice(0, -2) + "AA"].join("."); // 暗号文を書き換え
    expect(verifyToken(tampered)).toBeNull();
  });

  it("days は 1〜60 にクランプされる", () => {
    const v0 = verifyToken(mintToken({ geminiKey: "k", days: 0 }));
    const v999 = verifyToken(mintToken({ geminiKey: "k", days: 999 }));
    const now = Date.now();
    // 0日→最低1日、999日→最大60日
    expect(v0!.exp - now).toBeGreaterThan(0.5 * 86400000);
    expect(v999!.exp - now).toBeLessThanOrEqual(60 * 86400000 + 1000);
  });
});
