// 管理画面：発行済み診断の一覧（新しい順）。総合点・ランクはサーバで再計算。
import { listRecentDiagnoses } from "@/lib/store/diagnosis-store";
import { buildResultView } from "@/features/result";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const recs = await listRecentDiagnoses(50);
  const items = recs.map((r) => {
    const v = buildResultView(r.storeName, r.answers, { query: r.query, weights: r.weights });
    return { slug: r.slug, storeName: r.storeName, total: v.total, rank: v.rank, ts: r.ts, path: `/d/${r.slug}` };
  });
  return new Response(JSON.stringify({ ok: true, items }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
