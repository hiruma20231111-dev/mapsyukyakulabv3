// 管理画面：発行済み診断の一覧（新しい順）。総合点・ランクはサーバで再計算。
import { listRecentDiagnoses, getStats, deletePublicDiagnosis } from "@/lib/store/diagnosis-store";
import { buildResultView } from "@/features/result";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const recs = await listRecentDiagnoses(50);
  const items = await Promise.all(
    recs.map(async (r) => {
      const v = buildResultView(r.storeName, r.answers, { query: r.query, weights: r.weights });
      const s = await getStats(r.slug);
      return {
        slug: r.slug, storeName: r.storeName, total: v.total, rank: v.rank, ts: r.ts, path: `/d/${r.slug}`,
        views: s.views, consults: s.consults, lastTs: s.lastTs, expiresAt: r.expiresAt || 0,
        answers: r.answers,
      };
    }),
  );
  return new Response(JSON.stringify({ ok: true, items }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function DELETE(request: Request) {
  let slug = new URL(request.url).searchParams.get("slug") || "";
  if (!slug) {
    try { const b: any = await request.json(); slug = b?.slug || ""; } catch { /* noop */ }
  }
  if (!slug) return new Response(JSON.stringify({ error: "slugがありません" }), { status: 400, headers: { "Content-Type": "application/json" } });
  await deletePublicDiagnosis(slug);
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
}
