"use client";
// 検証用プレビュー（S4）：使い方マニュアル画面。
import { ManualScreen } from "@/features/onboarding";

export default function ManualPreview() {
  return (
    <main className="app">
      <ManualScreen onDone={() => console.log("[preview] manual done")} />
    </main>
  );
}
