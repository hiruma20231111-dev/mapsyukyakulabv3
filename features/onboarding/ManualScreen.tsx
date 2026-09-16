"use client";
// 使い方マニュアル：オーナー様が初回にスクロールで見る画面。見終わったら onDone で結果へ。
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/design/icons";
import { MANUAL_INTRO, MANUAL_SECTIONS, MANUAL_CTA } from "@/content/manual";

export function ManualScreen({ onDone }: { onDone: () => void }) {
  const [shown, setShown] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // カードを順に出す（reduce時は即表示）
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setShown(true); return; }
    const t = setTimeout(() => setShown(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="mn" ref={ref}>
      <header className="mn-hero">
        <span className="mn-eyebrow"><span className="mini" />{MANUAL_INTRO.eyebrow}</span>
        <h1 className="mn-title">{MANUAL_INTRO.title}</h1>
        <p className="mn-lead">{MANUAL_INTRO.lead}</p>
      </header>

      <div className="mn-body">
        <div className="mn-steplabel">この診断の見かた</div>
        {MANUAL_SECTIONS.map((s, i) => (
          <div
            key={s.title}
            className={`mn-card${shown ? " in" : ""}`}
            style={{ transitionDelay: `${i * 90}ms` }}
          >
            <span className="mn-card-ic"><Icon name={s.icon} size={22} /></span>
            <div>
              <div className="mn-card-t">{s.title}</div>
              <div className="mn-card-b">{s.body}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mn-cta">
        <button type="button" className="btn" onClick={onDone}>
          {MANUAL_CTA}<Icon name="check" size={18} />
        </button>
      </div>
    </div>
  );
}
