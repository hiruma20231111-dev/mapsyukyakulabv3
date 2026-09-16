"use client";
// 共通UI部品のギャラリー（開発・検証用）。各部品が単独で描画できることの確認場。
// features 実装後もカタログとして残す。本番導線には出さない。
import { useState, type CSSProperties } from "react";
import {
  Card, Button, Segmented, ProgressBar, ForceMeter, Markdown,
  GlossaryPopover, Screenshot, HowToDiagram, AiLoading, TabBar, FontSizeControl,
  type Tab,
} from "@/components/ui";

const TABS: Tab[] = [
  { key: "diag", icon: "search", label: "診断" },
  { key: "ai", icon: "chat", label: "相談" },
  { key: "guide", icon: "book", label: "ガイド" },
];

export default function UiGallery() {
  const [single, setSingle] = useState<string | number>(100);
  const [multi, setMulti] = useState<(string | number)[]>(["ig"]);
  const [tab, setTab] = useState("diag");
  const [fs, setFs] = useState(1);

  return (
    <main className="app" style={{ "--fs": String(fs) } as CSSProperties}>
      <FontSizeControl value={fs} onChange={setFs} />
      <div style={{ padding: "16px 16px 90px", display: "flex", flexDirection: "column", gap: 22 }}>
        <h1 style={{ fontSize: "var(--t-h1)", fontWeight: 900, color: "var(--navy)" }}>UI 部品カタログ</h1>

        <section>
          <h2 style={{ fontSize: "var(--t-h2)", marginBottom: 10 }}>Button</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Button icon="pulse">AIに診断・評価してもらう</Button>
            <Button variant="secondary" icon="chat">AIに相談する</Button>
            <Button variant="link">あとで設定する ›</Button>
            <Button disabled>あと3問 答えると受けられます</Button>
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: "var(--t-h2)", marginBottom: 10 }}>Segmented（単一 / 複数）</h2>
          <Segmented
            options={[{ label: "ばっちり", value: 100 }, { label: "自信ない", value: 50 }, { label: "未設定", value: 0 }]}
            selected={[single]}
            onSelect={setSingle}
          />
          <div style={{ height: 8 }} />
          <Segmented
            multi
            options={[
              { label: "Instagram", value: "ig" }, { label: "Facebook", value: "fb" },
              { label: "X", value: "x" }, { label: "運用なし", value: "none" },
            ]}
            selected={multi}
            onSelect={(v) =>
              setMulti((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur.filter((x) => x !== "none"), v]))
            }
          />
        </section>

        <section>
          <h2 style={{ fontSize: "var(--t-h2)", marginBottom: 10 }}>ProgressBar</h2>
          <ProgressBar value={58} />
        </section>

        <section>
          <h2 style={{ fontSize: "var(--t-h2)", marginBottom: 10 }}>ForceMeter（Google識別色）</h2>
          <Card>
            <ForceMeter
              forces={[
                { key: "display", label: "見つかる", value: 72 },
                { key: "contact", label: "選ばれる", value: 48 },
                { key: "visit", label: "来店", value: 30 },
                { key: "aio", label: "AI検索", value: 55 },
              ]}
            />
          </Card>
        </section>

        <section>
          <h2 style={{ fontSize: "var(--t-h2)", marginBottom: 10 }}>GlossaryPopover</h2>
          <Card>
            この店は <GlossaryPopover term="GBP" /> と <GlossaryPopover term="NAP" /> を整えると強くなります。
          </Card>
        </section>

        <section>
          <h2 style={{ fontSize: "var(--t-h2)", marginBottom: 10 }}>Markdown</h2>
          <Card>
            <Markdown text={"## 総評\nお店の**土台は良い**状態です。\n- カテゴリは正確\n- 写真がやや少なめ\n\n次の一手を決めましょう。"} />
          </Card>
        </section>

        <section>
          <h2 style={{ fontSize: "var(--t-h2)", marginBottom: 10 }}>HowToDiagram</h2>
          <Card><HowToDiagram hilite="情報を編集" title="お店のページ" /></Card>
        </section>

        <section>
          <h2 style={{ fontSize: "var(--t-h2)", marginBottom: 10 }}>AiLoading</h2>
          <Card><AiLoading dialect="std" /></Card>
        </section>
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />
    </main>
  );
}
