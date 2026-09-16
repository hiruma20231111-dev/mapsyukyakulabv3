// AI総評テキストの解析（純関数）。v1 page.js の splitSections / extractRival / FIX_RE を移植。

export interface AiSection {
  h: string;
  body: string[];
}

// 「## 見出し」や絵文字見出しでセクション分割
export function splitSections(text: string): AiSection[] {
  const s = String(text ?? "");
  const isH = (t: string) =>
    /^#{1,6}\s/.test(t) ||
    (/^\s*(?:\d+[.)]\s*)?(🩺|🎯|🛠️|🛠|📈|⚠️|⚠|✅|💡|📌|🔎|🏆)/.test(t) &&
      t.replace(/^#{1,6}\s/, "").replace(/^\s*\d+[.)]\s*/, "").length <= 26);
  const secs: AiSection[] = [];
  let cur: AiSection | null = null;
  for (const ln of s.split("\n")) {
    const t = ln.trimEnd();
    if (isH(t)) {
      cur = { h: t.replace(/^#{1,6}\s*/, "").replace(/^\s*\d+[.)]\s*/, ""), body: [] };
      secs.push(cur);
    } else {
      if (!cur) {
        cur = { h: "", body: [] };
        secs.push(cur);
      }
      cur.body.push(ln);
    }
  }
  return secs.filter((x) => x.h || x.body.join("").trim());
}

// AI診断の相乗り出力 @@RIVAL:<本文>@@ から、シミュ用のMEO他店文を取り出す
export function extractRival(text: string | null | undefined): string | null {
  const m = String(text || "").match(/@@RIVAL:([\s\S]*?)@@/);
  return m ? m[1].trim() : null;
}

// AI出力の @@FIX:key@@ を検出する正規表現
export const FIX_RE = /@@FIX:([a-zA-Z]+)@@/;

// RIVAL タグを本文から除去（画面表示用）
export function stripRival(text: string): string {
  return String(text || "").replace(/@@RIVAL:[\s\S]*?@@/g, "").trim();
}
