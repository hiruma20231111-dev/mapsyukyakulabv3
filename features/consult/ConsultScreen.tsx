"use client";
// 相談タブ（AIチャット）。v1 page.js Consult を feature に切り出し。
import { useEffect, useMemo, useState } from "react";
import { diagnose } from "@/lib/domain/diagnose";
import { useAppStore } from "@/state/app-store";
import { Card, Button, Markdown, Gear } from "@/components/ui";
import { Icon } from "@/design/icons";
import type { AiCreds } from "@/features/diagnosis/types";

const EXPERT_URL =
  "https://maru-nage.jp/meo-ai-agent/?utm_source=meta&utm_medium=display&utm_campaign=260803_FB_AT_FUSION_260803_AT_FUSION&utm_term=lp001&utm_content=N014_static_1080-1080";

interface Msg {
  role: "user" | "assistant";
  text: string;
}

export function ConsultScreen({
  pendingAsk,
  onConsumeAsk,
  onGoDiag,
  onOpenSettings,
}: {
  pendingAsk?: string | null;
  onConsumeAsk?: () => void;
  onGoDiag?: () => void;
  onOpenSettings?: () => void;
}) {
  const { answers, background, cfg, invite } = useAppStore();
  const result = useMemo(() => diagnose(answers), [answers]);
  const answered = Object.keys(answers).length;
  const done = answered >= 6;
  const hasKey = !!cfg.key || !!invite;
  const aiCreds: AiCreds = {
    key: cfg.key || undefined,
    invite: invite || undefined,
    model: cfg.model,
    dialect: cfg.dialect,
    tone: cfg.tone,
  };

  const [cmsgs, setCmsgs] = useState<Msg[]>([]);
  const [cin, setCin] = useState("");
  const [cbusy, setCbusy] = useState(false);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const cask = async (q: string) => {
    if (!q.trim() || cbusy || !hasKey) return;
    const history = cmsgs.slice(-6);
    setCmsgs((m) => [...m, { role: "user", text: q }]);
    setCin("");
    setCbusy(true);
    const diag = done ? { total: result.total, grade: result.grade, weak: result.weak.map((it) => it.q) } : null;
    try {
      const r = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...aiCreds, question: q, diagnosis: diag, background, history }),
      });
      const d = await r.json();
      setCmsgs((m) => [...m, { role: "assistant", text: d.error ? "⚠️ " + d.error : d.text }]);
    } catch {
      setCmsgs((m) => [...m, { role: "assistant", text: "⚠️ 通信エラー" }]);
    }
    setCbusy(false);
  };

  // 診断から渡ってきた質問を一度だけ自動送信
  useEffect(() => {
    if (!pendingAsk || !hasKey || cbusy) return;
    const q = pendingAsk;
    onConsumeAsk?.();
    void cask(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAsk, hasKey]);

  const chips = done
    ? ["最優先の3手は？", "今日やることを教えて", "弱点の直し方を具体的に", "オーナー登録のやり方は？", "パフォーマンス（インサイト）とは？", "説明文の書き方の例は？", "クチコミ返信の例文は？"]
    : ["カテゴリの選び方は？", "写真は何を何枚？", "オーナー登録のやり方は？", "パフォーマンス（インサイト）とは？", "Ask Mapsって何？", "属性はどう設定する？"];

  // 質問と回答をペアに
  const exchanges: { q: string; a: string | null; idx: number }[] = [];
  for (let i = 0; i < cmsgs.length; i++) {
    if (cmsgs[i].role === "user") {
      const a = cmsgs[i + 1] && cmsgs[i + 1].role === "assistant" ? cmsgs[i + 1].text : null;
      exchanges.push({ q: cmsgs[i].text, a, idx: exchanges.length });
    }
  }
  const completed = exchanges.filter((e) => e.a != null);
  const latest = completed[completed.length - 1] || null;
  const past = completed.slice(0, -1).reverse();
  const pendingQ = cbusy && exchanges.length && exchanges[exchanges.length - 1].a == null ? exchanges[exchanges.length - 1].q : null;

  const qCount = cmsgs.filter((m) => m.role === "user").length;
  const face = qCount >= 8 ? "🤩" : qCount >= 5 ? "😁" : qCount >= 3 ? "😄" : qCount >= 1 ? "😊" : "🙂";
  const mood =
    qCount >= 8 ? "最高にゴキゲン！たくさん相談ありがとう"
    : qCount >= 5 ? "ノッてきました！どんどん聞いてね"
    : qCount >= 3 ? "いい調子！一緒に良くしていきましょう"
    : qCount >= 1 ? "よろしくお願いします！"
    : "質問するほど元気になります";

  return (
    <>
      <div className="c-hero">
        {onOpenSettings && <Gear onClick={onOpenSettings} />}
        <div className="c-hero__b">
          <Icon name="chat" size={16} /> AIに相談
          {hasKey && <span className="c-badge">🤖 連携中</span>}
        </div>
        <h1>次の一手を、一緒に決めよう</h1>
        <p>{done ? "あなたの診断結果をふまえて答えます" : "用語・やり方から、お店の改善相談まで何でも"}</p>
        {hasKey && (
          <div className="c-buddy">
            <span className="c-face" key={face}>{face}</span>
            <div>
              <div className="c-mood">{mood}</div>
              <div className="c-hearts">{qCount > 0 ? "❤".repeat(Math.min(qCount, 6)) + (qCount > 6 ? "…" : "") : "🤍🤍🤍"}</div>
            </div>
          </div>
        )}
      </div>

      {!hasKey ? (
        <div className="c-sec">
          <Card>
            <p style={{ fontSize: 13.5, margin: "0 0 12px" }}>AI改善コンサルは、設定でGeminiキーを入れると使えます（無料キーOK）。</p>
            <Button icon="gear" onClick={() => onOpenSettings?.()}>設定を開く</Button>
          </Card>
        </div>
      ) : (
        <>
          {!done && (
            <div className="c-sec">
              <div className="d-note" style={{ marginTop: 0 }}>
                💡 先に「診断」を受けると、あなたのお店に合わせた相談ができます。
                <button className="c-go" onClick={() => onGoDiag?.()}>🔍 診断する ›</button>
              </div>
            </div>
          )}

          <div className="c-sec">
            {cbusy ? (
              <>
                {pendingQ && <div className="qbubble">{pendingQ}</div>}
                <div className="abubble"><div className="typing">分析中<span /><span /><span /></div></div>
              </>
            ) : latest ? (
              <>
                <div className="qbubble">{latest.q}</div>
                <div className="abubble"><Markdown text={latest.a || ""} /></div>
              </>
            ) : (
              <div className="abubble">
                こんにちは！{done ? "診断結果をふまえて、" : ""}Googleマップ集客の「次の一手」を一緒に考えます。下のボタンか入力からどうぞ。
              </div>
            )}
          </div>

          <div className="c-chips">
            {chips.map((c) => (
              <div key={c} className="c-chip" onClick={() => cask(c)}>{c}</div>
            ))}
          </div>
          <div className="c-sec">
            <div className="c-inputrow">
              <input
                className="c-input"
                value={cin}
                onChange={(e) => setCin(e.target.value)}
                placeholder="質問を入力…"
                onKeyDown={(e) => e.key === "Enter" && cask(cin)}
              />
              <Button onClick={() => cask(cin)} disabled={cbusy} style={{ width: "auto", padding: "0 16px" }}>➤</Button>
            </div>
          </div>

          {past.length > 0 && (
            <div className="c-sec c-past">
              <h2>🕘 過去の質問（{past.length}）</h2>
              {past.map((ex) => (
                <div className="pastitem" key={ex.idx}>
                  <button className="pastq" onClick={() => setOpenIdx(openIdx === ex.idx ? null : ex.idx)}>
                    <span>{ex.q}</span>
                    <span className="pastq-x">{openIdx === ex.idx ? "×" : "＋"}</span>
                  </button>
                  {openIdx === ex.idx && (
                    <div className="pasta">
                      <Markdown text={ex.a || ""} />
                      <button className="pasta-close" onClick={() => setOpenIdx(null)}>閉じる</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="c-sec">
        <Card className="c-expert">
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>👤 続ける時間がないときは</div>
          <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "0 0 10px" }}>
            更新の代行や来店体験づくりのサポートを頼む選択肢もあります（押し売りはしません）。
          </p>
          <a
            className="ui-btn ui-btn--secondary"
            style={{ textDecoration: "none" }}
            href={EXPERT_URL}
            target="_blank"
            rel="noreferrer"
          >
            📩 専門家に相談してみる
          </a>
        </Card>
      </div>
    </>
  );
}
