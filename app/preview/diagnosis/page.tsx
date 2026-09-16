"use client";
// 検証用プレビュー（Step9）。本番導線は app/page.tsx のタブ（Step11）で組む。
import { useEffect } from "react";
import { DiagnosisScreen } from "@/features/diagnosis";
import { useAppStore } from "@/state/app-store";

export default function DiagnosisPreview() {
  const hydrate = useAppStore((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  return (
    <main className="app">
      <DiagnosisScreen
        onAsk={(q) => console.log("[preview] ask:", q)}
        onGuide={(g) => console.log("[preview] guide:", g)}
      />
    </main>
  );
}
