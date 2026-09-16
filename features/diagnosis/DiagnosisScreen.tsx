"use client";
// 診断タブ（本丸）。v1 page.js の Diag ＋ Page.runAIDiagnose を feature に集約。
import { useMemo, useRef, useState, type ReactNode } from "react";
import { DIAG_ITEMS, type DiagItem } from "@/content/diagnosis-items";
import { GUIDE, type GuideTopic } from "@/content/guide";
import { LEVERS } from "@/content/levers";
import { diagnose, improvementItems, type Answers } from "@/lib/domain/diagnose";
import { simulate, BIZ_JP } from "@/lib/domain/simulation";
import { useAppStore } from "@/state/app-store";
import { Card, Button, Segmented, ForceMeter, AiLoading, ProgressBar, Gear } from "@/components/ui";
import type { ForceRow } from "@/components/ui";
import { StoreInfoCard } from "./StoreInfoCard";
import { SimCard } from "./SimCard";
import { AiVerdict } from "./AiVerdict";
import { InterestGate, type InterestMap } from "./InterestGate";
import { extractRival, stripRival } from "./parse";
import type { AiCreds } from "./types";
import { Icon } from "@/design/icons";

const ITEMS: readonly DiagItem[] = DIAG_ITEMS;
const TOPICS: readonly GuideTopic[] = GUIDE;
const TOTAL = DIAG_ITEMS.length;

export function DiagnosisScreen({
  onAsk,
  onGuide,
  onSettings,
}: {
  onAsk?: (question?: string) => void;
  onGuide?: (guideKey: string) => void;
  onSettings?: () => void;
}) {
  const { answers, background, bgInfo, biz, cfg, invite, aiDiagText } = useAppStore();
  const { setAnswers, setBackground, setBgInfo, setBiz, setAiDiagText } = useAppStore();

  const [interest, setInterest] = useState<InterestMap>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiErr, setAiErr] = useState("");

  const result = useMemo(() => diagnose(answers), [answers]);
  const answered = Object.keys(answers).length;
  const done = answered >= 6;
  const allDone = answered >= TOTAL;

  const hasKey = !!cfg.key || !!invite;
  const aiCreds: AiCreds = {
    key: cfg.key || undefined,
    invite: invite || undefined,
    model: cfg.model,
    dialect: cfg.dialect,
    tone: cfg.tone,
  };

  const track = (type: string, detail?: string) => {
    if (!invite) return;
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invite, type, detail }),
    }).catch(() => {});
  };
  const trackedDone = useRef(false);
  if (invite && !trackedDone.current && answered >= TOTAL) {
    trackedDone.current = true;
    track("diagnose_done");
  }

  const setSingle = (it: DiagItem, val: string | number) => setAnswers({ ...answers, [it.k]: val as number });
  const toggleMulti = (it: DiagItem, val: string | number) => {
    const cur = (answers[it.k] as string[]) || [];
    const v = String(val);
    let next: string[];
    if (v === "none") next = cur.includes("none") ? [] : ["none"];
    else {
      const base = cur.filter((x) => x !== "none");
      next = base.includes(v) ? base.filter((x) => x !== v) : [...base, v];
    }
    const na: Answers = { ...answers };
    if (next.length === 0) delete na[it.k];
    else na[it.k] = next;
    setAnswers(na);
  };

  const runAIDiagnose = async () => {
    if ((!cfg.key && !invite) || aiLoading) return;
    setAiLoading(true);
    setAiErr("");
    setAiDiagText("");
    const answersList = ITEMS.filter((it) => answers[it.k] != null).map((it) => {
      const opts = it.opts as readonly (readonly [string, number | string])[];
      if ("multi" in it && it.multi) {
        const sel = (answers[it.k] as string[]) || [];
        const label =
          sel.includes("none") || sel.length === 0
            ? "運用していない"
            : sel.map((id) => (opts.find(([, v]) => v === id) || [])[0]).filter(Boolean).join("・");
        return { q: it.q, label };
      }
      return { q: it.q, label: (opts.find(([, v]) => v === answers[it.k]) || ["—"])[0] };
    });
    const weakItems = improvementItems(answers, 99).map((it) => ({ k: it.k, q: it.q }));
    const sim = biz ? simulate(biz, result.levers, { rating: bgInfo?.rating, reviews: bgInfo?.reviewCount, answers }) : null;
    const simInfo = sim
      ? {
          bizLabel: BIZ_JP[biz!],
          sel: sim.sel,
          visits: sim.visits,
          ceiling: sim.ceiling,
          lifts: sim.lifts.map((l) => ({ lever: l.leverJP, gain: l.gain, items: l.items })),
        }
      : undefined;
    try {
      const r = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...aiCreds,
          mode: "diagnose",
          background,
          diagnosis: { total: result.total, grade: result.grade, levers: result.levers, answers: answersList },
          weakItems,
          bizLabel: biz ? BIZ_JP[biz] : undefined,
          simInfo,
        }),
      });
      const d = await r.json();
      if (d.error) setAiErr(d.error);
      else setAiDiagText(d.text || "");
    } catch {
      setAiErr("通信エラー");
    }
    setAiLoading(false);
  };

  const renderGate = (key: string): ReactNode => {
    const it = ITEMS.find((d) => d.k === key);
    const topic = it ? undefined : TOPICS.find((g) => g.key === key);
    if (!it && !topic) return null;
    return (
      <InterestGate
        it={it}
        topic={topic}
        interest={interest}
        setInterest={setInterest}
        hasKey={hasKey}
        onAsk={(q) => onAsk?.(q)}
        onGuide={(gk) => onGuide?.(gk)}
        track={track}
      />
    );
  };

  const forces: ForceRow[] = LEVERS.map((l) => ({ key: l.k, label: l.nm, value: result.levers[l.k] }));

  return (
    <>
      <div className="d-hero">
        {onSettings && <Gear onClick={onSettings} />}
        <div className="d-hero__brand">
          <Icon name="search" size={15} /> セルフ診断
        </div>
        <h1>{TOTAL}問で現在地をチェック</h1>
        <p>
          お店のGoogleページを見ながら、当てはまるものを選んでください。<b>{answered}/{TOTAL} 問</b>
        </p>
        <ProgressBar value={(answered / TOTAL) * 100} onHero />
      </div>

      {hasKey && (
        <div className="d-sec">
          <StoreInfoCard bgInfo={bgInfo} aiCreds={aiCreds} onBgInfo={setBgInfo} onBackground={setBackground} />
        </div>
      )}

      <div className="d-sec">
        {ITEMS.map((it) => {
          const opts = (it.opts as readonly (readonly [string, number | string])[]).map(([label, value]) => ({ label, value }));
          const selected = "multi" in it && it.multi ? ((answers[it.k] as string[]) || []) : answers[it.k] != null ? [answers[it.k] as number] : [];
          const multi = "multi" in it && it.multi;
          return (
            <Card key={it.k} style={{ marginBottom: 11 }}>
              <div className="d-qlabel">{it.q}</div>
              <Segmented
                options={opts}
                selected={selected}
                multi={multi}
                onSelect={(v) => (multi ? toggleMulti(it, v) : setSingle(it, v))}
              />
            </Card>
          );
        })}
      </div>

      {done && (
        <div className="d-sec">
          {hasKey ? (
            <>
              <h2>🩺 AIの診断・評価</h2>
              <Card style={{ marginBottom: 11 }}>
                <ForceMeter forces={forces} />
              </Card>
              {!aiDiagText && !aiLoading && (
                <p className="d-note">
                  あなたの回答{background ? "とお店の情報" : ""}をGBPガイドに照らして、
                  <b>今できていること・足りないこと・直すとどうなるか</b>を評価します（具体的な“今日の一手”は次の「AIに相談」で）。
                </p>
              )}
              {!aiDiagText && (
                <Button icon="pulse" onClick={runAIDiagnose} disabled={!allDone || aiLoading}>
                  {aiLoading ? "分析中…" : allDone ? "AIに診断・評価してもらう" : `あと${TOTAL - answered}問 答えると受けられます`}
                </Button>
              )}
              {aiLoading && <AiLoading dialect={cfg.dialect} />}
              {aiErr && <div className="verdict-bad">⚠️ {aiErr}</div>}
              {aiDiagText && <AiVerdict text={stripRival(aiDiagText)} renderGate={renderGate} />}
              {aiDiagText && (
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <Button onClick={() => onAsk?.()} style={{ flex: 1 }}>
                    AIに相談する ›
                  </Button>
                  <Button variant="secondary" onClick={runAIDiagnose} disabled={aiLoading} style={{ flex: "0 0 auto", width: "auto", padding: "0 16px" }}>
                    再診断
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="d-note">
              💡 設定でGeminiキーを入れると、<b>AIが「今できていること・足りないこと・直すとどうなるか」を診断・評価</b>します。
            </div>
          )}

          <SimCard
            biz={biz}
            setBiz={setBiz}
            levers={result.levers}
            answers={answers}
            rating={bgInfo?.rating}
            reviews={bgInfo?.reviewCount}
            aiStrength={extractRival(aiDiagText)}
          />
          <div className="d-note">効果は一般的傾向であり、成果を保証するものではありません。</div>
        </div>
      )}
    </>
  );
}
