"use client";
import type { ReactNode } from "react";
import { Markdown } from "@/components/ui";
import { splitSections, FIX_RE } from "./parse";

// AI総評を「## 見出し」ごとのカードに分割し、@@FIX:key@@ の位置に興味ゲートを差し込む。
// v1 AISections + renderBodyWithGates を移植。
export function AiVerdict({ text, renderGate }: { text: string; renderGate: (key: string) => ReactNode }) {
  return (
    <>
      {splitSections(text).map((sec, i) => (
        <div className="aisec" key={i}>
          {sec.h && <div className="aisec__h">{sec.h}</div>}
          <div>{renderBodyWithGates(sec.body.join("\n"), renderGate)}</div>
        </div>
      ))}
    </>
  );
}

function renderBodyWithGates(text: string, renderGate: (key: string) => ReactNode): ReactNode[] {
  const lines = String(text ?? "").split("\n");
  const out: ReactNode[] = [];
  let buf: string[] = [];
  const flush = () => {
    if (buf.length) {
      out.push(<div key={"b" + out.length}><Markdown text={buf.join("\n")} /></div>);
      buf = [];
    }
  };
  const gRe = new RegExp(FIX_RE.source, "g");
  for (const ln of lines) {
    const m = ln.match(FIX_RE);
    if (m) {
      const clean = ln.replace(gRe, "").trimEnd();
      if (clean) buf.push(clean);
      flush();
      const gate = renderGate(m[1]);
      if (gate) out.push(<div key={"g" + out.length}>{gate}</div>);
    } else {
      buf.push(ln.replace(gRe, "")); // マッチ漏れした印は表示から除去
    }
  }
  flush();
  return out;
}
