"use client";
// 設定画面。v1 settings/page.js を移植（状態は app-store 経由）。
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/state/app-store";
import { Card, Button } from "@/components/ui";
import { DIALECTS, TONES } from "@/features/onboarding";

const MODELS: [string, string][] = [
  ["gemini-2.5-flash", "Gemini 2.5 Flash（推奨・速い・無料枠）"],
  ["gemini-2.5-pro", "Gemini 2.5 Pro（高精度）"],
  ["gemini-2.0-flash", "Gemini 2.0 Flash（軽量）"],
];

const PREVIEW: Record<string, string> = {
  std_polite: "写真は外観・内観・メニューを最新で。表示から接触への後押しになります（一般的傾向）。",
  kansai_frank: "写真な、外観・内観・メニュー入れとこ。見られる→気になるの後押しになるで（あくまで一般的な傾向やけどな）。",
  hakata_comedian: "写真スカスカやん!…って冗談はさておき、外観・内観・メニュー入れよ? 選ばれる後押しになるとよ（※効果は一般的傾向、保証はできんばい）。",
  tohoku_polite: "写真っこ、外観・内観・メニューば最新にしとくといいべ。見つかって選ばれる後押しになるっちゃ（一般的な傾向だども）。",
  nagoya_frank: "写真、外観・内観・メニュー入れときゃあ。見られて気になる、の後押しになるがや（一般的な傾向だけどな）。",
  kyoto_polite: "お写真は外観・内観・お品書きを新しゅうしとくとよろしおす。選ばれる後押しになりますえ（一般的な傾向どすけど）。",
  std_comedian: "写真、少なっ!……はい本題。外観・内観・メニューを追加で。表示→接触の後押しになります（※効果は一般的傾向、保証はナシで）。",
  std_hot: "いきましょう!写真は外観・内観・メニューを最新に!ここが表示→接触を動かす一歩です(一般的傾向)!",
  std_calm: "写真:外観・内観・メニューを最新化。表示→接触に寄与(一般的傾向)。",
};

export default function Settings() {
  const setCfg = useAppStore((s) => s.setCfg);
  const hydrate = useAppStore((s) => s.hydrate);

  const [key, setKey] = useState("");
  const [model, setModel] = useState("gemini-2.5-flash");
  const [dialect, setDialect] = useState("std");
  const [tone, setTone] = useState("polite");
  const [advisor, setAdvisor] = useState(false);
  const [saved, setSaved] = useState(false);
  const [test, setTest] = useState<{ ok: boolean; t: string } | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    hydrate();
    const s = useAppStore.getState();
    setKey(s.cfg.key);
    setModel(s.cfg.model);
    setDialect(s.cfg.dialect);
    setTone(s.cfg.tone);
    setAdvisor(!!s.invite);
    document.documentElement.style.setProperty("--fs", String(s.fs));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = () => {
    setCfg({ key: key.trim(), model, dialect, tone });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const runTest = async () => {
    setTesting(true);
    setTest(null);
    try {
      const r = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key.trim(), model, test: true }),
      });
      const d = await r.json();
      setTest(d.ok ? { ok: true, t: `接続OK（${d.model}）` } : { ok: false, t: d.error || "失敗" });
    } catch {
      setTest({ ok: false, t: "通信エラー" });
    }
    setTesting(false);
  };

  const preview = PREVIEW[dialect + "_" + tone] || PREVIEW["std_" + tone] || PREVIEW.std_polite;
  const dialectName = DIALECTS.find((d) => d[0] === dialect)?.[1];
  const toneName = TONES.find((t) => t[0] === tone)?.[1];

  return (
    <main className="app">
      <div className="o-hero" style={{ paddingBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="o-hero__brand">⚙️ 設定</div>
          <Link href="/" style={{ color: "#fff", fontSize: 13 }}>← 戻る</Link>
        </div>
        <h1 style={{ fontSize: 20 }}>{advisor ? "AIの話し方の設定" : "AIのセットアップ"}</h1>
        <p>{advisor ? "AIの方言・ニュアンスを選べます。" : "Geminiキーを入れると「AIアシスタント」が起動します。"}</p>
      </div>

      <div className="o-sec">
        {!advisor && (
          <>
            <h2>Gemini API キー</h2>
            <Card>
              <input
                className="o-input"
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="AIza… で始まるキー"
              />
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>モデル</span>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  style={{ flex: 1, padding: 10, borderRadius: 9, border: "1px solid var(--line)", fontFamily: "inherit", background: "var(--surface)", color: "var(--ink)" }}
                >
                  {MODELS.map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Button onClick={save}>{saved ? "✓ 保存しました" : "保存する"}</Button>
                <Button variant="secondary" onClick={runTest} disabled={testing || !key.trim()}>
                  {testing ? "テスト中…" : "接続テスト"}
                </Button>
              </div>
              {test && (
                <div className="d-note" style={{ background: test.ok ? "var(--accent-soft)" : "#fff5f0", color: test.ok ? "var(--accent-deep)" : "#b4460f" }}>
                  {test.ok ? "✓ " : "⚠️ "}
                  {test.t}
                </div>
              )}
              <div className="d-note">
                キーは<b>この端末のブラウザ内だけ</b>に保存。サーバーには保存しません。<br />
                無料キー: <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Google AI Studio</a>
              </div>
            </Card>
          </>
        )}

        <h2 style={{ marginTop: 16 }}>🎭 AIの言語（方言）</h2>
        <Card>
          <div className="pchips">
            {DIALECTS.map(([k, n]) => (
              <span key={k} className={"pchip" + (dialect === k ? " on" : "")} onClick={() => setDialect(k)}>{n}</span>
            ))}
          </div>
        </Card>

        <h2 style={{ marginTop: 16 }}>🎭 ニュアンス</h2>
        <Card>
          <div className="pchips">
            {TONES.map(([k, n]) => (
              <span key={k} className={"pchip" + (tone === k ? " on" : "")} onClick={() => setTone(k)}>{n}</span>
            ))}
          </div>
        </Card>

        <Card style={{ marginTop: 11 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>プレビュー（写真の項目の言い方）</div>
          <div style={{ fontSize: 12, color: "var(--accent-deep)", fontWeight: 700, marginBottom: 4 }}>🤖 {dialectName} × {toneName}</div>
          <div style={{ fontSize: 13, lineHeight: 1.7 }}>{preview}</div>
          <div className="d-note">
            🛡️ <b>AI憲法で保証</b>：口調をどう変えても「効果は一般的傾向・保証しない」「簡易セルフ診断」などの注記と、事実・境界（クチコミ集めの有料ノウハウは出さない）は必ず守られます。
          </div>
          <div style={{ marginTop: 12 }}>
            <Button onClick={save}>{saved ? "✓ 保存しました" : "この設定で保存"}</Button>
          </div>
        </Card>

        {!advisor && (
          <>
            <h2 style={{ marginTop: 16 }}>🔐 担当者メニュー</h2>
            <Card>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 10 }}>
                招待リンク／QRの発行と、利用状況ダッシュボードはこちら（この端末にだけ表示。お客様の画面には出ません）。
              </div>
              <Link href="/admin" className="ui-btn ui-btn--primary" style={{ textDecoration: "none" }}>
                🔐 管理ダッシュボードを開く
              </Link>
            </Card>
          </>
        )}
      </div>
      <div style={{ height: 30 }} />
    </main>
  );
}
