// オーナー様が受け取る診断結果ページ（固有URL・キー不要で閲覧可）。
import { getPublicDiagnosis, recordEvent } from "@/lib/store/diagnosis-store";
import { buildResultView } from "@/features/result";
import { OwnerView } from "./OwnerView";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function DiagnosisResultPage({ params }: { params: { slug: string } }) {
  const rec = await getPublicDiagnosis(params.slug);
  if (!rec) {
    return (
      <main className="app">
        <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--muted)" }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)", marginBottom: 8 }}>診断が見つかりませんでした</p>
          <p style={{ fontSize: 13 }}>リンクの有効期限が切れているか、URLが正しくない可能性があります。</p>
        </div>
      </main>
    );
  }
  recordEvent(params.slug, "views").catch(() => {});
  const data = buildResultView(rec.storeName, rec.answers, { query: rec.query, weights: rec.weights, descText: rec.descText, keywords: rec.keywords });
  return (
    <main className="app">
      <OwnerView data={data} slug={params.slug} />
    </main>
  );
}
