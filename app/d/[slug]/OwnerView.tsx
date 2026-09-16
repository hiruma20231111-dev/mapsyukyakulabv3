"use client";
// オーナー様の入口：初回は使い方マニュアル → 見終わったら診断結果。
// 2回目以降は localStorage で判定してマニュアルを飛ばす。
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ManualScreen } from "@/features/onboarding";
import { ResultScreen } from "@/features/result";
import type { ResultView } from "@/features/result";

export function OwnerView({ data, slug }: { data: ResultView; slug: string }) {
  // null=判定前（マニュアルもチラつかせない）
  const [showManual, setShowManual] = useState<boolean | null>(null);
  const router = useRouter();
  const key = `maplab_manual_seen:${slug}`;

  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem(key) === "1"; } catch { /* noop */ }
    setShowManual(!seen);
  }, [key]);

  const done = () => {
    try { localStorage.setItem(key, "1"); } catch { /* noop */ }
    setShowManual(false);
  };

  if (showManual === null) return null; // ハイドレーション前は何も出さない
  if (showManual) return <ManualScreen onDone={done} />;
  return <ResultScreen data={data} onConsult={() => router.push(`/d/${slug}/consult`)} />;
}
