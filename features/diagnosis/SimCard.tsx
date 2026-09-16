"use client";
import { simulate, BIZ, BIZ_JP } from "@/lib/domain/simulation";
import type { LeverKey } from "@/content/levers";
import type { Answers } from "@/lib/domain/diagnose";

// FB② 1000人シミュレーション。v1 SimCard を移植。
export function SimCard({
  biz,
  setBiz,
  levers,
  answers,
  rating,
  reviews,
  aiStrength,
}: {
  biz: string | null;
  setBiz: (b: string) => void;
  levers: Partial<Record<LeverKey, number | null>>;
  answers: Answers;
  rating?: number | null;
  reviews?: number | null;
  aiStrength?: string | null;
}) {
  const sim = biz ? simulate(biz, levers, { rating, reviews, answers }) : null;
  const pct = sim ? Math.max(1, Math.min(100, sim.sel / 10)) : 0;
  const strength = aiStrength || (sim && sim.strength);

  return (
    <div className="sim">
      <div className="sim__head">
        <span className="sim__title">🎯 1000人シミュレーション</span>
        <span className="sim__pred">AIの予測</span>
      </div>
      <div className="sim__biz">
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>業種</span>
        <select value={biz || ""} onChange={(e) => setBiz(e.target.value)}>
          <option value="" disabled>
            選んでください
          </option>
          {BIZ.map(([s, j]) => (
            <option key={s} value={s}>
              {j}
            </option>
          ))}
        </select>
      </div>
      {sim ? (
        <>
          <div className="sim__lead">1000人が「近くの{BIZ_JP[biz!]}」で探したら…</div>
          <div className="sim__num">
            <b>{sim.sel}</b>
            <span>人 / 1000人 が選択</span>
          </div>
          <div className="sim__bar">
            <i style={{ width: pct + "%" }} />
          </div>
          <div className="sim__pct">
            {(sim.sel / 10).toFixed(1)}%
            {sim.adjusted && <span className="sim__adj">（あなたの★・件数で補正）</span>}
          </div>
          <div className="sim__visit">
            → うち <b>約{sim.visits}人</b> が来店につながりそう
            <span className="sim__visit-n">（選択 × 予約導線）</span>
          </div>
          {strength && (
            <div className="sim__why">
              <b>選ばれてる他店：</b>
              {strength}
              {aiStrength && <span> 🤖</span>}
            </div>
          )}
          {sim.lifts.length > 0 && (
            <div className="sim__lift">
              <div className="sim__lift-h">🔧 診断をもとに、直すと増えるところ</div>
              {sim.lifts.map((l) => (
                <div className="sim__lift-row" key={l.lever}>
                  <div>
                    「{l.leverJP}」
                    {l.items.length > 0 && <span className="sim__lift-it">＝{l.items.join("・")}</span>}
                  </div>
                  <div className="sim__lift-g">
                    {sim.sel}→{l.improved}人 <b>+{l.gain}</b>
                  </div>
                </div>
              ))}
              <div className="sim__lift-ceil">✨ ぜんぶ整えば最大 約{sim.ceiling}人</div>
            </div>
          )}
          <div className="sim__foot">※{sim.label}</div>
        </>
      ) : (
        <div className="sim__pickhint">👆 業種を選ぶと、あなたの診断をもとに予測が出ます</div>
      )}
    </div>
  );
}
