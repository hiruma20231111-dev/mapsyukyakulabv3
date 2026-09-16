import { Fragment, type ReactNode } from "react";

// **太字** を <strong> に
function bold(str: string): ReactNode[] {
  return str.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i}>{p.slice(2, -2)}</strong>
    ) : (
      <Fragment key={i}>{p}</Fragment>
    ),
  );
}

// Gemini の markdown を簡易描画（見出し / 箇条書き / 段落）。v1 renderMd を移植・整理。
export function Markdown({ text }: { text: string }) {
  const s = String(text ?? "");
  return (
    <>
      {s.split("\n").map((ln, i) => {
        const t = ln.trimEnd();
        if (/^#{1,6}\s/.test(t)) return <div key={i} className="ui-md-h">{bold(t.replace(/^#{1,6}\s/, ""))}</div>;
        if (/^\s*[-*・]\s/.test(t)) return <div key={i} className="ui-md-li">{bold(t.replace(/^\s*[-*・]\s/, ""))}</div>;
        if (/^\s*\d+[.)]\s/.test(t)) return <div key={i} className="ui-md-li">{bold(t.replace(/^\s*\d+[.)]\s/, ""))}</div>;
        if (!t) return <div key={i} className="ui-md-gap" />;
        return <p key={i} className="ui-md-p">{bold(t)}</p>;
      })}
    </>
  );
}
