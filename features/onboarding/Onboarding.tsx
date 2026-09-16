"use client";
// 招待リンク初回のオンボーディング（方言・トーン・お店の情報）。v1 Onboarding を移植。
import { useState } from "react";
import { Card, Button } from "@/components/ui";
import { Icon } from "@/design/icons";
import { DIALECTS, TONES } from "./options";

export function Onboarding({
  initialDialect = "std",
  initialTone = "polite",
  onDone,
}: {
  initialDialect?: string;
  initialTone?: string;
  onDone: (v: { dialect: string; tone: string; store: string }) => Promise<void> | void;
}) {
  const [dialect, setDialect] = useState(initialDialect);
  const [tone, setTone] = useState(initialTone);
  const [store, setStore] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="app">
      <div className="o-hero">
        <div className="o-hero__brand">
          <Icon name="pin" size={15} /> マップ集客ラボ
        </div>
        <h1>ようこそ！<br />はじめに設定しましょう</h1>
        <p>30秒で終わります。あとから変更もできます。</p>
      </div>
      <div className="o-sec">
        <h2>① AIの話し方（方言）</h2>
        <div className="pchips">
          {DIALECTS.map(([k, n]) => (
            <span key={k} className={"pchip" + (dialect === k ? " on" : "")} onClick={() => setDialect(k)}>
              {n}
            </span>
          ))}
        </div>
        <h2 style={{ marginTop: 16 }}>② ニュアンス</h2>
        <div className="pchips">
          {TONES.map(([k, n]) => (
            <span key={k} className={"pchip" + (tone === k ? " on" : "")} onClick={() => setTone(k)}>
              {n}
            </span>
          ))}
        </div>
        <h2 style={{ marginTop: 16 }}>③ あなたのお店（任意・貼るほど診断が具体的に）</h2>
        <Card>
          <input
            className="o-input"
            value={store}
            onChange={(e) => setStore(e.target.value)}
            placeholder="GoogleビジネスプロフィールのURL or お店の名前"
          />
          <div className="d-note">
            入れておくと、AIが検索であなたのお店の公開情報を調べ、診断・アドバイスに反映します（概算・後で確認可）。空でもOK。
          </div>
        </Card>
        <div style={{ marginTop: 4 }}>
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await onDone({ dialect, tone, store: store.trim() });
            }}
          >
            {busy ? "準備中…" : "🚀 はじめる"}
          </Button>
        </div>
      </div>
      <div style={{ height: 30 }} />
    </div>
  );
}
