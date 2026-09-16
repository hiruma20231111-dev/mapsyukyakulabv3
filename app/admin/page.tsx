"use client";
// 商談アドバイザー管理ダッシュボード。v1 admin/page.js を移植。
import { useState, useEffect } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { Card, Button, Markdown } from "@/components/ui";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function Admin() {
  const [gkey, setGkey] = useState("");
  const [label, setLabel] = useState("");
  const [days, setDays] = useState(14);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [lastQR, setLastQR] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [uloading, setUloading] = useState(false);
  const [uerr, setUerr] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState<any>(null);
  const [copied, setCopied] = useState("");
  const [diagModal, setDiagModal] = useState<any>(null);
  const [diagLoad, setDiagLoad] = useState("");

  const urlFromToken = (token: string) => `${typeof window !== "undefined" ? window.location.origin : ""}/?k=${encodeURIComponent(token)}`;

  const loadUsage = async (keyArg?: string) => {
    const k = (keyArg || gkey).trim();
    if (!k || uloading) return;
    setUloading(true);
    setUerr("");
    try {
      const r = await fetch("/api/usage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ geminiKey: k }) });
      const d = await r.json();
      if (d.error) setUerr(d.error);
      else setUsage(d);
    } catch {
      setUerr("通信エラー");
    }
    setUloading(false);
  };

  useEffect(() => {
    try {
      document.documentElement.style.setProperty("--fs", localStorage.getItem("ml_fs") || "1");
    } catch {}
    const k = localStorage.getItem("ml_admin_gkey") || "";
    setGkey(k);
    if (k) loadUsage(k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const issue = async () => {
    if (!gkey.trim() || busy) return;
    setBusy(true);
    setErr("");
    try {
      localStorage.setItem("ml_admin_gkey", gkey.trim());
    } catch {}
    try {
      const r = await fetch("/api/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ geminiKey: gkey.trim(), label: label.trim(), days: Number(days) || 14 }) });
      const d = await r.json();
      if (d.error) setErr(d.error);
      if (d.token) {
        const url = urlFromToken(d.token);
        const qr = await QRCode.toDataURL(url, { margin: 1, width: 240 });
        setLastQR({ label: d.label || label.trim() || "（無題）", url, exp: d.exp, qr });
        setLabel("");
        loadUsage();
      }
    } catch {
      setErr("通信エラー");
    }
    setBusy(false);
  };

  const showQR = async (label: string, token: string) => {
    if (!token) return;
    const url = urlFromToken(token);
    const qr = await QRCode.toDataURL(url, { margin: 1, width: 260 });
    setModal({ label, url, qr });
  };
  const copyLink = (token: string, id: string) => {
    if (!token) return;
    navigator.clipboard?.writeText(urlFromToken(token));
    setCopied(id);
    setTimeout(() => setCopied(""), 1500);
  };
  const viewDiag = async (id: string, label: string) => {
    setDiagLoad(id);
    try {
      const r = await fetch("/api/diag", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ geminiKey: gkey.trim(), id }) });
      const d = await r.json();
      if (d.diag) setDiagModal({ label, diag: d.diag });
      else setUerr(d.error || "診断を取得できませんでした。");
    } catch {
      setUerr("通信エラー");
    }
    setDiagLoad("");
  };
  const delStore = async (id: string, label: string) => {
    if (!window.confirm(`「${label}」を履歴から削除しますか？（元に戻せません）`)) return;
    try {
      await fetch("/api/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ geminiKey: gkey.trim(), id }) });
      loadUsage();
    } catch {}
  };

  const badge = (p: any) => {
    if (p.expired) return { txt: "期限切れ", bg: "#fdece9", col: "#d9403a", border: "#f0b8b3" };
    if (p.daysLeft != null && p.daysLeft <= 3) return { txt: `あと${p.daysLeft}日`, bg: "#fff5e6", col: "#c07a13", border: "#f0d9a8" };
    return { txt: p.daysLeft != null ? `あと${p.daysLeft}日` : "—", bg: "#e7f6f3", col: "#0b7d70", border: "#cfe7e0" };
  };

  return (
    <main className="app">
      <div className="o-hero" style={{ paddingBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="o-hero__brand">🔐 商談アドバイザー管理</div>
          <Link href="/" style={{ color: "#fff", fontSize: 13 }}>← アプリへ</Link>
        </div>
        <h1 style={{ fontSize: 20 }}>招待発行＆利用ダッシュボード</h1>
        <p>相手ごとに招待リンク/QRを発行。あなたのキーは暗号化して埋め込み（相手は読めません）。</p>
      </div>

      <div className="o-sec">
        <h2 style={{ fontSize: 14 }}>🎟️ 招待を発行</h2>
        <Card>
          <label style={{ fontSize: 12, color: "var(--muted)" }}>あなたのGemini APIキー（この端末に保存）</label>
          <input className="o-input" type="password" value={gkey} onChange={(e) => setGkey(e.target.value)} placeholder="Geminiキーを貼り付け" style={{ marginTop: 4 }} />
          <div className="d-note">まだ無い場合は <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Google AI Studio</a> で無料発行。※発行ぶんの利用があなたのキーに課金されます。</div>
          <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginTop: 10 }}>相手・店舗名</label>
          <input className="o-input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="例：ピンクドルフィン" style={{ marginTop: 4 }} />
          <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginTop: 10 }}>有効日数（既定14日・最大60）</label>
          <input className="o-input" type="number" value={days} min={1} max={60} onChange={(e) => setDays(Number(e.target.value))} style={{ width: 120, marginTop: 4 }} />
          <div style={{ marginTop: 12 }}>
            <Button onClick={issue} disabled={busy}>{busy ? "発行中…" : "🎟️ 招待リンク＋QRを発行"}</Button>
          </div>
          {err && <div className="verdict-bad" style={{ marginTop: 10 }}>⚠️ {err}</div>}
        </Card>

        {lastQR && (
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>✅ 発行しました：{lastQR.label}</div>
              <button onClick={() => setLastQR(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--muted)" }}>×</button>
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>有効期限：{new Date(lastQR.exp).toLocaleString("ja-JP")}</div>
            <img src={lastQR.qr} alt="QR" style={{ width: 200, height: 200, border: "1px solid var(--line)", borderRadius: 10, display: "block", margin: "0 auto 10px" }} />
            <div style={{ fontSize: 11, wordBreak: "break-all", background: "var(--panel)", padding: 8, borderRadius: 8 }}>{lastQR.url}</div>
            <div style={{ marginTop: 8 }}>
              <Button variant="secondary" onClick={() => navigator.clipboard?.writeText(lastQR.url)}>🔗 リンクをコピー</Button>
            </div>
          </Card>
        )}

        <h2 style={{ fontSize: 14, marginTop: 22 }}>📊 利用ダッシュボード</h2>
        {uerr && <div className="verdict-bad">⚠️ {uerr}</div>}
        {usage && (usage.alerts > 0 || usage.soon > 0) && (
          <Card style={{ borderColor: usage.alerts ? "#f0b8b3" : "#f0d9a8" }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>
              {usage.alerts > 0 && <span style={{ color: "#d9403a" }}>🔴 期限切れ {usage.alerts}件　</span>}
              {usage.soon > 0 && <span style={{ color: "#c07a13" }}>🟠 まもなく期限 {usage.soon}件</span>}
            </div>
          </Card>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0 0 8px" }}>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>{usage?.prospects ? `${usage.prospects.length} 店舗` : ""}</div>
          <Button variant="secondary" onClick={() => loadUsage()} disabled={uloading} style={{ width: "auto", padding: "6px 12px", fontSize: 13 }}>
            {uloading ? "更新中…" : "🔄 更新"}
          </Button>
        </div>

        {usage && usage.prospects && usage.prospects.length === 0 && (
          <div className="d-note">まだ発行した店舗がありません。上の「招待を発行」から追加すると、ここに並びます。</div>
        )}
        {usage && usage.prospects && usage.prospects.map((p: any) => {
          const bd = badge(p);
          const isOpen = open[p.id];
          return (
            <Card key={p.id} style={{ borderColor: p.expired ? "#f0b8b3" : "var(--line)", cursor: "pointer" }}>
              <div onClick={() => setOpen((o) => ({ ...o, [p.id]: !o[p.id] }))}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: p.expired ? "#d9403a" : "var(--ink)" }}>{p.expired ? "🔴 " : ""}{p.label}</div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: bd.col, background: bd.bg, border: `1px solid ${bd.border}`, borderRadius: 8, padding: "3px 9px", whiteSpace: "nowrap" }}>{bd.txt}</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {p.used
                    ? Object.entries(p.counts).map(([t, n]: any) => (
                        <span key={t} style={{ background: "var(--panel)", color: "var(--ink)", fontSize: 11, borderRadius: 6, padding: "3px 6px" }}>
                          {usage.typeLabels[t] || t}: {n}
                        </span>
                      ))
                    : <span style={{ fontSize: 11.5, color: "var(--muted)" }}>まだ未利用（発行のみ）</span>}
                </div>
                <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 6 }}>
                  {p.last ? `最終利用: ${new Date(p.last).toLocaleString("ja-JP")}` : p.created ? `発行: ${new Date(p.created).toLocaleDateString("ja-JP")}` : ""}
                  　{p.exp ? `／ 期限: ${new Date(p.exp).toLocaleDateString("ja-JP")}` : ""}　{isOpen ? "▲" : "▼"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                {p.token && <Button variant="secondary" onClick={() => showQR(p.label, p.token)} style={{ width: "auto", padding: "7px 12px", fontSize: 12 }}>📱 QR</Button>}
                {p.token && <Button variant="secondary" onClick={() => copyLink(p.token, p.id)} style={{ width: "auto", padding: "7px 12px", fontSize: 12 }}>{copied === p.id ? "✅ コピー済" : "🔗 リンク"}</Button>}
                {p.hasDiag && <Button onClick={() => viewDiag(p.id, p.label)} disabled={diagLoad === p.id} style={{ width: "auto", padding: "7px 12px", fontSize: 12 }}>{diagLoad === p.id ? "読込中…" : "🩺 診断"}</Button>}
                <Button variant="secondary" onClick={() => delStore(p.id, p.label)} style={{ width: "auto", padding: "7px 12px", fontSize: 12 }}>🗑 削除</Button>
              </div>
              {isOpen && p.recent && p.recent.length > 0 && (
                <div style={{ borderTop: "1px dashed var(--line)", marginTop: 8, paddingTop: 8 }}>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>最近のAI質問</div>
                  {p.recent.map((r: any, i: number) => <div key={i} style={{ fontSize: 12, padding: "2px 0" }}>・{r.t}</div>)}
                </div>
              )}
            </Card>
          );
        })}
      </div>
      <div style={{ height: 30 }} />

      {diagModal && (
        <div onClick={() => setDiagModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(10,20,16,.6)", zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "24px 14px", overflowY: "auto" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: 16, padding: 18, maxWidth: 460, width: "100%", margin: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>🩺 {diagModal.label} の診断</div>
              <button onClick={() => setDiagModal(null)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "var(--muted)" }}>×</button>
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10 }}>{diagModal.diag.ts ? `診断日時: ${new Date(diagModal.diag.ts).toLocaleString("ja-JP")}` : ""}</div>
            {diagModal.diag.background && (
              <div style={{ fontSize: 11, color: "var(--muted)", background: "var(--panel)", borderRadius: 10, padding: "8px 12px", marginBottom: 12 }}>
                <b>店舗の公開情報（参考）</b><br />{diagModal.diag.background}
              </div>
            )}
            <div style={{ fontSize: 13.5, lineHeight: 1.7 }}>
              <Markdown text={diagModal.diag.text} />
            </div>
            <div style={{ marginTop: 14 }}>
              <Button variant="secondary" onClick={() => setDiagModal(null)}>閉じる</Button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div onClick={() => setModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(10,20,16,.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: 16, padding: 18, maxWidth: 340, width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>🎟️ {modal.label}</div>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "var(--muted)" }}>×</button>
            </div>
            <img src={modal.qr} alt="QR" style={{ width: "100%", maxWidth: 260, border: "1px solid var(--line)", borderRadius: 10, display: "block", margin: "0 auto 10px" }} />
            <div style={{ fontSize: 11, wordBreak: "break-all", background: "var(--panel)", padding: 8, borderRadius: 8 }}>{modal.url}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <Button onClick={() => navigator.clipboard?.writeText(modal.url)}>🔗 リンクをコピー</Button>
              <Button variant="secondary" onClick={() => setModal(null)} style={{ width: "auto", padding: "0 18px" }}>閉じる</Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
