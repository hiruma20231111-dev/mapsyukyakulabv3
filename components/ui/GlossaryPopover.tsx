"use client";
import { useState, type ReactNode } from "react";
import { GLOSSARY } from "@/content/glossary";

// 用語の (?) ボタン → タップで説明、× で閉じる。v1 Info を移植。
export function GlossaryPopover({ term, children }: { term: string; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const g = GLOSSARY[term];
  return (
    <span className="ui-term" onClick={(e) => e.stopPropagation()}>
      {children || term}
      <button className="ui-qbtn" onClick={() => setOpen(!open)} aria-label="用語の説明">
        ?
      </button>
      {open && (
        <span className="ui-tpop">
          <button className="ui-popx" onClick={() => setOpen(false)} aria-label="閉じる">
            ×
          </button>
          {g}
        </span>
      )}
    </span>
  );
}
