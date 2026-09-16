"use client";
// 検証用プレビュー（Step10）。本番導線は app/page.tsx のタブ（Step11）で組む。
import { useEffect } from "react";
import { ConsultScreen } from "@/features/consult";
import { useAppStore } from "@/state/app-store";

export default function ConsultPreview() {
  const hydrate = useAppStore((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  return (
    <main className="app">
      <ConsultScreen
        onGoDiag={() => console.log("[preview] go diag")}
        onOpenSettings={() => console.log("[preview] open settings")}
      />
    </main>
  );
}
