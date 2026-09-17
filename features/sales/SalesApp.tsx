"use client";
// 営業ツールのシェル：ダッシュボード（利用状況）／新規診断発行／設定（Geminiキー・配点）。
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Icon } from "@/design/icons";
import { IntakeFlow } from "@/features/intake";
import { DIAG_CATEGORIES, DEFAULT_WEIGHTS, type CategoryKey } from "@/content/diagnosis-v3";

type View = "dashboard" | "new" | "settings";
type ReAnswers = Partial<Record<CategoryKey, Record<string, number | null>>>;
interface ListItem { slug: string; storeName: string; total: number; rank: string; ts: number; path: string; views?: number; consults?: number; lastTs?: number; expiresAt?: number; answers?: ReAnswers }

function expiryLabel(expiresAt?: number): string {
  if (!expiresAt) return "無期限";
  const d = Math.ceil((expiresAt - Date.now()) / 86400000);
  if (d <= 0) return "期限切れ";
  return `残り${d}日`;
}
type Weights = Record<CategoryKey, number>;

function relTime(ts?: number): string {
  if (!ts) return "";
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return "さっき";
  const m = Math.floor(s / 60); if (m < 60) return `${m}分前`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}時間前`;
  const d = Math.floor(h / 24); return `${d}日前`;
}

const KEYS = DIAG_CATEGORIES.map((c) => c.key);

export function SalesApp() {
  const [view, setView] = useState<View>("dashboard");
  const [items, setItems] = useState<ListItem[] | null>(null);
  const [keyReady, setKeyReady] = useState(false);
  const [qrItem, setQrItem] = useState<ListItem | null>(null);
  const [resultItem, setResultItem] = useState<ListItem | null>(null);
  const [reissue, setReissue] = useState<{ storeName?: string; answers?: ReAnswers } | null>(null);

  const loadList = () =>
    fetch("/api/diagnoses").then((r) => r.json()).then((d) => setItems(d?.items || [])).catch(() => setItems([]));
  // AI連携＝サーバーの共有キー（設定で保存）が入っているか。サーバー基準で判定（localStorageの誤表示を排除）。
  const refreshAi = () => {
    fetch("/api/config").then((r) => r.json()).then((d) => setKeyReady(!!d?.hasKey)).catch(() => setKeyReady(false));
  };

  useEffect(() => { loadList(); refreshAi(); }, []);

  const backToDash = () => { setView("dashboard"); setReissue(null); refreshAi(); loadList(); };

  const del = async (it: ListItem) => {
    if (!window.confirm(`「${it.storeName}」の診断を削除します。元に戻せません。よろしいですか？`)) return;
    try { await fetch(`/api/diagnoses?slug=${encodeURIComponent(it.slug)}`, { method: "DELETE" }); } catch { /* noop */ }
    loadList();
  };

  if (view === "new") return <IntakeFlow onDone={backToDash} initial={reissue ?? undefined} />;
  if (view === "settings") return <Settings onBack={backToDash} />;

  // ---- ダッシュボード ----
  const now = new Date();
  const thisMonth = (items || []).filter((it) => {
    const d = new Date(it.ts);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  return (
    <div className="sa">
      <div className="sa-top">
        <span className="mk"><i className="b" /><i className="y" /><i className="g" /><i className="r" /></span>
        <span className="name">マップ集客ラボ</span>
        <span className="role">営業</span>
        <button className="gear" onClick={() => setView("settings")} aria-label="設定"><Icon name="gear" size={19} /></button>
      </div>

      <div className="sa-body">
        <div className={`sa-ai ${keyReady ? "ok" : "ng"}`}>
          <Icon name={keyReady ? "check" : "spark"} size={16} />
          {keyReady ? "AI連携：設定済み（AI精査・相談が使えます）" : "AI連携：未設定"}
          {!keyReady && <span className="set" onClick={() => setView("settings")}>設定する</span>}
        </div>

        <div className="sa-stats">
          <div className="sa-stat"><div className="n">{items ? items.length : "–"}</div><div className="l">発行した診断</div></div>
          <div className="sa-stat"><div className="n">{items ? thisMonth : "–"}</div><div className="l">今月の発行</div></div>
        </div>

        <button className="sa-new" onClick={() => { setReissue(null); setView("new"); }}>
          <Icon name="spark" size={22} />新規診断を発行
        </button>

        <div className="sa-sec-t">発行した診断<span className="cnt">{items ? `${items.length}件` : ""}</span></div>
        {items == null ? (
          <div className="sa-empty">読み込み中…</div>
        ) : items.length === 0 ? (
          <div className="sa-empty">まだ発行がありません。「新規診断を発行」から始めましょう。</div>
        ) : (
          <div className="sa-list">
            {items.map((it) => (
              <div className="sa-card2" key={it.slug}>
                <div className="sa-row2-top">
                  <div className="sa-row-mid">
                    <div className="sa-row-name">{it.storeName}</div>
                    <div className="sa-row-date">{new Date(it.ts).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}発行</div>
                    <div className="sa-row-stat">
                      {(it.views ?? 0) === 0 ? (
                        <span className="st-none">● 未閲覧</span>
                      ) : (
                        <>
                          <span className="st-on">● 閲覧 {it.views}</span>
                          {(it.consults ?? 0) > 0 && <span className="st-ai">相談 {it.consults}</span>}
                          {it.lastTs ? <span className="st-time">最終 {relTime(it.lastTs)}</span> : null}
                        </>
                      )}
                    </div>
                  </div>
                  <span className="sa-row-rank">{it.rank}</span>
                  <span className="sa-row-score">{it.total}</span>
                  <button className="sa-del" onClick={() => del(it)} aria-label="削除" title="削除">✕</button>
                </div>
                <div className="sa-row-exp">公開期限：{expiryLabel(it.expiresAt)}</div>
                <div className="sa-acts">
                  <button className="sa-act" onClick={() => setResultItem(it)}><Icon name="search" size={15} />結果を見る</button>
                  <button className="sa-act" onClick={() => setQrItem(it)}><Icon name="link" size={15} />QR / URL</button>
                  <button className="sa-act" onClick={() => { setReissue({ storeName: it.storeName, answers: it.answers }); setView("new"); }}><Icon name="spark" size={15} />再診断</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {qrItem && <QrModal item={qrItem} onClose={() => setQrItem(null)} />}
      {resultItem && <ResultModal item={resultItem} onClose={() => setResultItem(null)} />}
    </div>
  );
}

// ---- 診断結果ポップアップ（営業がダッシュボードから確認）----
function ResultModal({ item, onClose }: { item: ListItem; onClose: () => void }) {
  return (
    <div className="sa-rmodal-mask" onClick={onClose}>
      <div className="sa-rmodal" onClick={(e) => e.stopPropagation()}>
        <div className="sa-rmodal-head">
          <span className="sa-rmodal-name">{item.storeName}</span>
          <button className="sa-rmodal-x" onClick={onClose} aria-label="閉じる">✕</button>
        </div>
        <iframe className="sa-rmodal-frame" src={`${item.path}?v=sales`} title={`${item.storeName} の診断結果`} />
      </div>
    </div>
  );
}

// ---- QR / URL 再表示モーダル ----
function QrModal({ item, onClose }: { item: ListItem; onClose: () => void }) {
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.origin + item.path : item.path;
  useEffect(() => { QRCode.toDataURL(url, { margin: 1, width: 320 }).then(setQr).catch(() => {}); }, [url]);
  return (
    <div className="sa-modal-mask" onClick={onClose}>
      <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sa-modal-t">{item.storeName}</div>
        <div className="sa-modal-d">このQR / リンクをお客様にお渡しください</div>
        {qr ? <div className="sa-modal-qr"><img src={qr} alt="診断ページのQR" /></div> : null}
        <div className="sa-modal-url"><Icon name="link" size={14} />{url}</div>
        <div className="sa-modal-acts">
          <button className="sa-btn primary" onClick={async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* noop */ } }}>{copied ? "コピーしました" : "リンクをコピー"}</button>
          <button className="sa-btn ghost" onClick={onClose}>閉じる</button>
        </div>
      </div>
    </div>
  );
}

// ---- 設定（Geminiキー・配点）----
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

function Settings({ onBack }: { onBack: () => void }) {
  const [gkey, setGkey] = useState("");
  const [keySaved, setKeySaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState("");
  const [weights, setWeights] = useState<Weights>({ ...DEFAULT_WEIGHTS });
  const [wSaved, setWSaved] = useState(false);

  useEffect(() => {
    try { setGkey(localStorage.getItem("maplab_gkey") || ""); } catch { /* noop */ }
    setWeights(loadWeights());
  }, []);

  const saveKey = async () => {
    try {
      if (gkey.trim()) localStorage.setItem("maplab_gkey", gkey.trim());
      else localStorage.removeItem("maplab_gkey");
    } catch { /* noop */ }
    // サーバー共有設定にも保存＝既存も含む全診断のAI相談・精査で使われる。
    try {
      await fetch("/api/config", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geminiKey: gkey.trim() }),
      });
    } catch { /* noop */ }
    setKeySaved(true); setTimeout(() => setKeySaved(false), 2200);
  };

  const testKey = async () => {
    setTesting(true); setTestMsg("");
    try {
      const r = await fetch("/api/ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: true, key: gkey.trim(), model: "gemini-2.5-flash" }),
      });
      const d = await r.json();
      setTestMsg(d?.ok ? "接続OK（このキーで使えます）" : `NG：${d?.error || "接続できませんでした"}`);
    } catch {
      setTestMsg("NG：通信エラー");
    } finally {
      setTesting(false);
    }
  };

  const total = KEYS.reduce((a, k) => a + (weights[k] || 0), 0);
  const ok = total === 100;
  const setW = (k: CategoryKey, v: number) => { setWeights((p) => ({ ...p, [k]: v })); setWSaved(false); };
  const saveW = () => { try { localStorage.setItem("maplab_weights", JSON.stringify(weights)); setWSaved(true); setTimeout(() => setWSaved(false), 1800); } catch { /* noop */ } };

  return (
    <div className="sa">
      <button className="sa-back" onClick={onBack}><span aria-hidden style={{ fontSize: 18, fontWeight: 900 }}>‹</span>ダッシュボード</button>
      <div className="sa-body">
        <div className="sa-card">
          <div className="sa-card-t">AI連携（Gemini APIキー）</div>
          <div className="sa-card-d">AI精査・AIに相談を使うためのキーです。この端末に保存され、発行時に診断へ紐づきます（お客様には表示されません）。</div>
          <div className="sa-field" style={{ margin: 0 }}>
            <label>Gemini API キー</label>
            <div className="sa-inline">
              <input className="sa-input" type="password" value={gkey} onChange={(e) => setGkey(e.target.value)} placeholder="AIza… で始まるキー" autoComplete="off" />
              <button className="sa-save" onClick={saveKey}>保存</button>
            </div>
            <div className="sa-actions" style={{ marginTop: 10 }}>
              <button className="sa-btn ghost" onClick={testKey} disabled={testing || !gkey.trim()}>{testing ? "テスト中…" : "接続テスト"}</button>
            </div>
            {keySaved && <div className="sa-saved">保存しました。</div>}
            {testMsg && <div className="sa-saved" style={{ color: testMsg.startsWith("接続OK") ? "var(--accent-deep)" : "var(--danger)" }}>{testMsg}</div>}
          </div>
        </div>

        <div className="sa-card">
          <div className="sa-card-t">配点（重み）</div>
          <div className="sa-card-d">合計100になるよう調整。初期値はカンリー基準。保存すると次の発行から反映されます。</div>
          {DIAG_CATEGORIES.map((c) => (
            <div className="sa-w" key={c.key}>
              <div className="sa-w-top"><span className="sa-w-name">{c.name}</span><span className="sa-w-val">{weights[c.key]}</span></div>
              <input className="sa-range" type="range" min={0} max={50} step={1} value={weights[c.key]} onChange={(e) => setW(c.key, Number(e.target.value))} />
            </div>
          ))}
          <div className={`sa-total ${ok ? "ok" : "ng"}`}><span>合計</span><span>{total} / 100 {ok ? "OK" : total > 100 ? "多すぎ" : "不足"}</span></div>
          <div className="sa-actions">
            <button className="sa-btn ghost" onClick={() => { setWeights({ ...DEFAULT_WEIGHTS }); setWSaved(false); }}>初期値に戻す</button>
            <button className="sa-btn primary" onClick={saveW} disabled={!ok} style={ok ? undefined : { opacity: .55 }}>保存</button>
          </div>
          {wSaved && <div className="sa-saved" style={{ textAlign: "center" }}>保存しました。</div>}
        </div>
      </div>
    </div>
  );
}
