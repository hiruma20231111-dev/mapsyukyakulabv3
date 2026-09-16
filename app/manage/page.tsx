"use client";
// 管理画面（営業向け）：配点調整（保存はlocalStorage）＋発行済み診断の一覧。
import { useEffect, useState } from "react";
import "./manage.css";
import { DIAG_CATEGORIES, DEFAULT_WEIGHTS, type CategoryKey } from "@/content/diagnosis-v3";

type Weights = Record<CategoryKey, number>;
interface ListItem { slug: string; storeName: string; total: number; rank: string; ts: number; path: string }

const KEYS = DIAG_CATEGORIES.map((c) => c.key);

function loadWeights(): Weights {
  try {
    const raw = localStorage.getItem("maplab_weights");
    if (raw) {
      const w = JSON.parse(raw);
      const out = { ...DEFAULT_WEIGHTS } as Weights;
      for (const k of KEYS) if (typeof w[k] === "number") out[k] = w[k];
      return out;
    }
  } catch { /* noop */ }
  return { ...DEFAULT_WEIGHTS };
}

export default function ManagePage() {
  const [weights, setWeights] = useState<Weights>({ ...DEFAULT_WEIGHTS });
  const [saved, setSaved] = useState(false);
  const [items, setItems] = useState<ListItem[] | null>(null);

  useEffect(() => { setWeights(loadWeights()); }, []);
  useEffect(() => {
    fetch("/api/diagnoses").then((r) => r.json()).then((d) => setItems(d?.items || [])).catch(() => setItems([]));
  }, []);

  const total = KEYS.reduce((a, k) => a + (weights[k] || 0), 0);
  const ok = total === 100;

  const setW = (k: CategoryKey, v: number) => { setWeights((p) => ({ ...p, [k]: v })); setSaved(false); };
  const reset = () => { setWeights({ ...DEFAULT_WEIGHTS }); setSaved(false); };
  const save = () => { try { localStorage.setItem("maplab_weights", JSON.stringify(weights)); setSaved(true); } catch { /* noop */ } };

  return (
    <main className="app">
      <div className="mg">
        <div className="mg-h">管理</div>
        <div className="mg-sub">配点の調整と、発行した診断の一覧。</div>

        <section className="mg-sec">
          <div className="mg-sec-t">配点（重み）</div>
          <div className="mg-sec-d">合計100になるように調整してください。初期値はカンリー基準です。ここで保存すると、次に発行する診断から反映されます。</div>
          {DIAG_CATEGORIES.map((c) => (
            <div className="mg-w" key={c.key}>
              <div className="mg-w-top">
                <span className="mg-w-name">{c.name}</span>
                <span className="mg-w-val">{weights[c.key]}</span>
              </div>
              <input
                className="mg-range" type="range" min={0} max={50} step={1}
                value={weights[c.key]} onChange={(e) => setW(c.key, Number(e.target.value))}
              />
            </div>
          ))}
          <div className={`mg-total ${ok ? "ok" : "ng"}`}>
            <span className="lab">合計</span>
            <span className="val">{total}<span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700 }}> / 100</span></span>
            <span className="hint">{ok ? "OK" : total > 100 ? "多すぎます" : "足りません"}</span>
          </div>
          <div className="mg-actions">
            <button className="mg-btn ghost" onClick={reset}>初期値に戻す</button>
            <button className="mg-btn primary" onClick={save} disabled={!ok} style={ok ? undefined : { opacity: .55, cursor: "default" }}>保存</button>
          </div>
          {saved && <div className="mg-saved">保存しました。次の発行から反映されます。</div>}
        </section>

        <section className="mg-sec">
          <div className="mg-sec-t">発行した診断</div>
          <div className="mg-sec-d">新しい順（最新50件）。タップで結果ページを開きます。</div>
          {items == null ? (
            <div className="mg-empty">読み込み中…</div>
          ) : items.length === 0 ? (
            <div className="mg-empty">まだ発行された診断はありません。</div>
          ) : (
            <div className="mg-list">
              {items.map((it) => (
                <a className="mg-row" key={it.slug} href={it.path}>
                  <div className="mg-row-mid">
                    <div className="mg-row-name">{it.storeName}</div>
                    <div className="mg-row-date">{new Date(it.ts).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                  <span className="mg-row-rank">{it.rank}</span>
                  <span className="mg-row-score">{it.total}</span>
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
