"use client";
import { useEffect, useState } from "react";

const LOADING_MSG: Record<string, string> = {
  std: "AIがあなたのお店を分析しています…",
  kansai: "AIがめっちゃ分析中やで〜！ちょい待ってな",
  hakata: "AIが分析しよるけん、ちょっと待っとって〜",
  tohoku: "AIが分析してるだ〜、ちょっこら待ってけろ",
  nagoya: "AIが分析しとるがや〜、ちょお待っとりゃあ",
  kyoto: "AIが分析してますえ〜、少々お待ちやす",
};
const STEPS = ["お店の情報を読み込み", "強み・弱みを整理", "改善の優先順位を計算", "AI検索対策をチェック", "総評を仕上げ"];

export function AiLoading({ dialect = "std" }: { dialect?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => Math.min(x + 1, STEPS.length - 1)), 1400);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="ui-aiload">
      <div className="ui-aiload__msg">{LOADING_MSG[dialect] || LOADING_MSG.std}</div>
      <div className="ui-aiload__steps">
        {STEPS.map((s, k) => (
          <div key={k} className={"ui-aiload__step" + (k < i ? " done" : k === i ? " now" : "")}>
            <span>{k < i ? "✓" : "●"}</span>
            {s}
          </div>
        ))}
      </div>
      <div className="ui-aiload__bar">
        <i />
      </div>
    </div>
  );
}
