"use client";
// 検証用プレビュー（S2）。本番の再閲覧は /d/[slug]（S3）で組む。
import { ResultScreen, buildResultView } from "@/features/result";
import type { V3Answers } from "@/lib/domain/score";

// 承認モックv6.1のサンプル（美容室LURE中目黒店・総合59/ランクC）に相当する入力。
const SAMPLE: V3Answers = {
  profile: { category: 100, menu: 100, reservation: 0, link: 100 }, // 75% → 23（緑）
  photo: { count: 55, ownerPhotos: 15, fresh: 55 },                // 約42% → 6（黄）
  review: { count: 55, rating: 100, latest: 100, reply: 50 },      // 約76% → 15（緑）
  post: { count: 30, continuity: 0 },                              // 15% → 2（赤）
  citation: { nap: 50, media: 100, sns: 40 },                      // 約63% → 13（緑）
};

export default function ResultPreview() {
  const data = buildResultView("美容室 LURE 中目黒店", SAMPLE, { query: "中目黒 美容室 おすすめ" });
  return (
    <main className="app">
      <ResultScreen data={data} onConsult={() => console.log("[preview] consult")} />
    </main>
  );
}
