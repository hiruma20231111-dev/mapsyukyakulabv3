"use client";
// MAPガイド タブ。v1 page.js GuideScreen を feature に切り出し。
// 読了トラッキングは app-store（ml_read_guides 互換）を使う。
import { useEffect, useMemo, useRef, useState } from "react";
import { GUIDE, type GuideTopic } from "@/content/guide";
import { LEVERS } from "@/content/levers";

// `as const` の厳密型を共通型にゆるめたビュー（optional な shot 等へ素直にアクセス）
const TOPICS: readonly GuideTopic[] = GUIDE;
import { useAppStore } from "@/state/app-store";
import { Card, Screenshot, HowToDiagram, GlossaryPopover, Gear } from "@/components/ui";
import { Icon, type IconName } from "@/design/icons";

// ガイドkey → アイコン（絵文字の置換）
const GUIDE_ICON: Record<string, IconName> = {
  basic: "pin",
  photo: "camera",
  post: "mega",
  review: "star",
  menu: "list",
  action: "calendar",
  aio: "spark",
  citation: "link",
};

const leverNames = (keys: readonly string[]) =>
  keys.map((l) => LEVERS.find((y) => y.k === l)?.nm).filter(Boolean).join("/");

export function GuideScreen({
  selected,
  onSelect,
  onSettings,
}: {
  selected?: string | null;
  onSelect?: (key: string | null) => void;
  onSettings?: () => void;
}) {
  // 外部制御（診断からのジャンプ）にも、内部状態にも対応
  const [inner, setInner] = useState<string | null>(null);
  const gsel = selected !== undefined ? selected : inner;
  const setGsel = (k: string | null) => (onSelect ? onSelect(k) : setInner(k));

  const readGuides = useAppStore((s) => s.readGuides);
  const markGuideRead = useAppStore((s) => s.markGuideRead);

  const g = TOPICS.find((x) => x.key === gsel);
  const readCount = TOPICS.filter((x) => readGuides[x.key]).length;
  const sorted = useMemo(() => [...TOPICS].sort((a, b) => (a.priority || 9) - (b.priority || 9)), []);
  const [justRead, setJustRead] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setJustRead(false), [gsel]);

  // 詳細を最後までスクロールしたら「完読！」（v1 の判定を移植）
  useEffect(() => {
    if (!g) return;
    let done = false;
    const mark = () => {
      if (done) return;
      done = true;
      markGuideRead(g.key);
      setJustRead(true);
    };
    const check = () => {
      const doc = document.documentElement;
      const end = endRef.current;
      const byWin = window.innerHeight + window.scrollY >= doc.scrollHeight - 90;
      const byEl = end ? end.getBoundingClientRect().top <= window.innerHeight - 60 : false;
      if (byWin || byEl) mark();
    };
    const t = setTimeout(check, 350);
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [g, markGuideRead]);

  return (
    <>
      <div className="g-hero">
        {onSettings && <Gear onClick={onSettings} />}
        <div className="g-hero__brand">
          <Icon name="book" size={15} /> GBP最適化ガイド
        </div>
        <h1>{g ? g.title : "何を直すと集客に効く？"}</h1>
        {!g && (
          <p>
            完読 {readCount}/{TOPICS.length}
            {readCount >= TOPICS.length ? "　🏆 全ガイド制覇！" : ""}
          </p>
        )}
      </div>

      <div className="g-sec">
        {!g && (
          <Card className="g-list">
            {sorted.map((x) => (
              <button key={x.key} className="g-row" onClick={() => setGsel(x.key)}>
                <span className="g-row__ic">
                  <Icon name={GUIDE_ICON[x.key] || "pin"} size={22} />
                </span>
                <span className="g-row__body">
                  <span className="g-row__nm">
                    {x.title}
                    {readGuides[x.key] && <span className="g-readmark">✓ 完読</span>}
                  </span>
                  <span className="g-row__ds">{x.what.slice(0, 24)}…</span>
                </span>
                <span className="g-row__meta">
                  {x.priority <= 2 ? (
                    <span className="g-prio">{x.priority === 1 ? "最優先" : "優先"}</span>
                  ) : (
                    <span className="g-lv">{leverNames(x.levers)}</span>
                  )}
                </span>
              </button>
            ))}
          </Card>
        )}

        {g && (
          <>
            <button className="g-back" onClick={() => setGsel(null)}>
              ← 一覧へ
            </button>
            <Card>
              <div className="g-detail__ic">
                <Icon name={GUIDE_ICON[g.key] || "pin"} size={26} />
              </div>
              {g.shot ? (
                <Screenshot src={g.shot.src} box={g.shot.box} cap={g.shot.cap} />
              ) : (
                <HowToDiagram hilite={g.hilite} title={g.title} />
              )}
              <dt style={{ fontWeight: 800, fontSize: 13, marginTop: 6 }}>やり方（手順）</dt>
              <ol className="g-steps">
                {g.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
              <dl className="g-dl">
                <dt>何をする？</dt>
                <dd>{g.what}</dd>
                <dt>なぜ効く？</dt>
                <dd>{g.why}</dd>
                <dt>効果</dt>
                <dd className="g-effect">{g.effect}</dd>
                <dt>そのままにすると</dt>
                <dd>{g.risk}</dd>
                <dt>コツ</dt>
              </dl>
              {g.tips.map((t, i) => (
                <div className="g-tip" key={i}>
                  {t}
                </div>
              ))}
              {g.deep && g.deep.length > 0 && (
                <div className="g-deep">
                  <div className="g-deep__h">もっと詳しく（しくみ・効き方）</div>
                  {g.deep.map((d, i) => (
                    <div className="g-deep__item" key={i}>
                      <div className="g-deep__dh">{d.h}</div>
                      <div className="g-deep__dt">{d.t}</div>
                    </div>
                  ))}
                </div>
              )}
              {g.terms && g.terms.length > 0 && (
                <div className="g-terms">
                  {g.terms.map((k) => (
                    <GlossaryPopover key={k} term={k} />
                  ))}
                </div>
              )}
              {(readGuides[g.key] || justRead) && (
                <div className="g-readdone">🎉 完読！ このガイドを最後まで読みました</div>
              )}
              <div ref={endRef} style={{ height: 1 }} />
            </Card>
          </>
        )}
      </div>
    </>
  );
}
