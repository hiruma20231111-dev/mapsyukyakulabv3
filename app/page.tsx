"use client";
// マップ集客ラボ V3 トップ＝営業モードの入口。
// 営業が対象店舗のGBP状況を5項目で入力→発行。お客様は発行された /d/<slug> のリンクだけを使う。
// 営業のGeminiキーは URL の ?k=招待トークン（初回に自動保存）で受け取り、発行レコードに載せてAI相談/精査を有効化する。
import { IntakeFlow } from "@/features/intake";

export default function Page() {
  return (
    <main className="app">
      <IntakeFlow />
    </main>
  );
}
