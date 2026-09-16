"use client";
// マップ集客ラボ V3 トップ＝営業ダッシュボード。
// ダッシュボード（利用状況）→ 新規診断発行（入力→プレビュー→発行）→ 発行するとダッシュボードに反映。
// 設定でGemini APIキーと配点を管理。お客様は発行された /d/<slug> のリンクだけを使う。
import { SalesApp } from "@/features/sales";

export default function Page() {
  return (
    <main className="app">
      <SalesApp />
    </main>
  );
}
