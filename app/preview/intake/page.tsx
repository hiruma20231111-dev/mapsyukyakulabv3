"use client";
// 検証用プレビュー（S3）：営業モードの入力→発行フロー。
import { IntakeFlow } from "@/features/intake";

export default function IntakePreview() {
  return (
    <main className="app">
      <IntakeFlow />
    </main>
  );
}
