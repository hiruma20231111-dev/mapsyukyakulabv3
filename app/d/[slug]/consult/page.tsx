// オーナー様のAI相談ページ（診断結果をふまえて相談）。
import { getPublicDiagnosis } from "@/lib/store/diagnosis-store";
import { ConsultV3 } from "@/features/consult";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ConsultPage({ params }: { params: { slug: string } }) {
  const rec = await getPublicDiagnosis(params.slug);
  if (!rec) {
    return (
      <main className="app">
        <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--muted)" }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)", marginBottom: 8 }}>診断が見つかりませんでした</p>
        </div>
      </main>
    );
  }
  return (
    <main className="app">
      <ConsultV3 slug={params.slug} storeName={rec.storeName} />
    </main>
  );
}
