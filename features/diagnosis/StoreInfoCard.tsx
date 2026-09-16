"use client";
import { useState } from "react";
import { Card } from "@/components/ui";
import type { BgInfo } from "@/state/persistence";
import type { AiCreds } from "./types";
import { fmtBg } from "./util";

const DIAG_TOTAL = 12;

// 収集情報カード（検索で取れるカテゴリ＋手入力のクチコミ点数/件数）。v1 Diag の storebox を移植。
export function StoreInfoCard({
  bgInfo,
  aiCreds,
  onBgInfo,
  onBackground,
}: {
  bgInfo: BgInfo | null;
  aiCreds: AiCreds;
  onBgInfo: (info: BgInfo | null) => void;
  onBackground: (bg: string) => void;
}) {
  const [link, setLink] = useState("");
  const [fetching, setFetching] = useState(false);
  const [perr, setPerr] = useState("");
  const [showInput, setShowInput] = useState(false);

  const setBgField = (field: keyof BgInfo, val: number | null) => {
    const next = { ...(bgInfo || {}), [field]: val };
    onBgInfo(next);
    onBackground(fmtBg(next, next.name || next.query));
  };

  const lookup = async () => {
    if (!link.trim() || fetching) return;
    setFetching(true);
    setPerr("");
    try {
      const r = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...aiCreds, input: link.trim() }),
      });
      const d = await r.json();
      if (d.error) setPerr(d.error);
      else if (d.found) {
        const info: BgInfo = { ...d.info, query: d.query };
        onBgInfo(info);
        onBackground(fmtBg(d.info, link.trim()));
        setShowInput(false);
        setLink("");
      }
    } catch {
      setPerr("通信エラー");
    }
    setFetching(false);
  };

  if (bgInfo && !showInput) {
    return (
      <Card>
        <div className="sb-t">🔎 AIがGBPから取得した情報（診断の材料）</div>
        <div className="sb-n">
          {bgInfo.name || bgInfo.query || "—"}
          {bgInfo.area ? <span className="sb-area"> ／ {bgInfo.area}</span> : null}
        </div>
        <div className="sb-grid">
          <div className="sb-row">
            <span>カテゴリ<i className="sb-src">検索</i></span>
            <b>{bgInfo.category || "不明"}</b>
          </div>
          <div className="sb-row">
            <span>クチコミ点数<i className="sb-src man">手入力</i></span>
            <input
              className="sb-in"
              type="number"
              step="0.1"
              min="0"
              max="5"
              inputMode="decimal"
              placeholder="例 4.2"
              value={bgInfo.rating ?? ""}
              onChange={(e) => setBgField("rating", e.target.value === "" ? null : parseFloat(e.target.value))}
            />
          </div>
          <div className="sb-row">
            <span>クチコミ数<i className="sb-src man">手入力</i></span>
            <input
              className="sb-in"
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="例 128"
              value={bgInfo.reviewCount ?? ""}
              onChange={(e) => setBgField("reviewCount", e.target.value === "" ? null : parseInt(e.target.value, 10))}
            />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>お店が違う？</span>
          <button
            className="qi__reopen"
            onClick={() => {
              setShowInput(true);
              onBgInfo(null);
              onBackground("");
            }}
          >
            ❌ 別のお店（再検索）
          </button>
        </div>
        <div className="d-note">
          クチコミ点数・件数は、Googleマップのお店ページを見て入力してください（検索では正確に取れないため手入力）。
          写真枚数・投稿・説明文などは下の{DIAG_TOTAL}問でお答えください。この情報＋回答でAIが診断します。
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="d-qlabel">🔗 GBP/Googleマップのリンク or 店名（任意）</div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          className="sb-in"
          style={{ flex: 1, width: "auto", textAlign: "left" }}
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="貼るとAIが背景情報を集めます"
          onKeyDown={(e) => e.key === "Enter" && lookup()}
        />
        <button
          className="qi__yes"
          style={{ flex: "0 0 auto", padding: "0 14px" }}
          onClick={lookup}
          disabled={fetching}
        >
          {fetching ? "検索中" : "🤖 調べる"}
        </button>
      </div>
      {perr && <div className="d-note" style={{ background: "#fff5f0", color: "#b4460f" }}>⚠️ {perr}</div>}
      <div className="d-note">設問は自動では埋めません（ご自身で回答）。これはAI総評の背景に使います。</div>
    </Card>
  );
}
