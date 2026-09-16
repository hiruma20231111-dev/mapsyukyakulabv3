// 検証用プレビュー（Step8）。本番導線は app/page.tsx のタブ（Step11）で組む。
import { GuideScreen } from "@/features/guide";

export default function GuidePreview() {
  return (
    <main className="app">
      <GuideScreen />
    </main>
  );
}
