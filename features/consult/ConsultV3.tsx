"use client";
// オーナー様のAI相談画面。診断結果(slug)を文脈に /api/consult とやり取りする。
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/design/icons";

interface Msg { role: "user" | "ai"; text: string }

// **強調** を虹色アニメ下線のハイライトに変換（AIメッセージ用）。
function renderHl(text: string) {
  return text.split(/\*\*(.+?)\*\*/g).map((p, i) =>
    i % 2 === 1 ? <span key={i} className="cv-hl">{p}</span> : <span key={i}>{p}</span>,
  );
}

const SUGGESTS = ["集客をもっと増やしたい", "何から手をつけるか迷ってる", "今のままで大丈夫か不安"];

export function ConsultV3({ slug, storeName }: { slug: string; storeName: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "ai", text: `${storeName ? storeName + "さん、" : ""}こんにちは。診断を見せてもらいました。\nいま、いちばん気になっているのはどんなことですか？` },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [suggests, setSuggests] = useState<string[]>(SUGGESTS);
  const [fs, setFs] = useState<"s" | "m" | "l">("m");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const v = localStorage.getItem("maplab_cvfs");
      if (v === "s" || v === "m" || v === "l") setFs(v);
    } catch { /* noop */ }
  }, []);
  const chooseFs = (v: "s" | "m" | "l") => { setFs(v); try { localStorage.setItem("maplab_cvfs", v); } catch { /* noop */ } };
  const fsScale = fs === "s" ? 0.9 : fs === "l" ? 1.2 : 1;

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, busy]);

  async function send(q: string) {
    const question = q.trim();
    if (!question || busy) return;
    const history = msgs.map((m) => ({ role: m.role === "user" ? "user" : "model", text: m.text }));
    setMsgs((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setBusy(true);
    setSuggests([]); // 回答が返るまで候補は隠す
    try {
      const r = await fetch("/api/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, question, history }),
      });
      const d = await r.json();
      const text = d?.answer || d?.error || "うまく応答できませんでした。";
      setMsgs((prev) => [...prev, { role: "ai", text }]);
      // AIが返した深掘り候補を次のタップ用に表示（無ければ既定に戻す）
      setSuggests(Array.isArray(d?.suggestions) && d.suggestions.length ? d.suggestions : SUGGESTS);
    } catch {
      setMsgs((prev) => [...prev, { role: "ai", text: "通信エラーが起きました。少し時間をおいてお試しください。" }]);
      setSuggests(SUGGESTS);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cv" style={{ ["--cvfs" as string]: String(fsScale) }}>
      <div className="cv-head">
        <a className="cv-back" href={`/d/${slug}`} aria-label="診断結果に戻る"><span aria-hidden style={{ fontSize: 20, fontWeight: 900, lineHeight: 1 }}>‹</span></a>
        <span className="cv-orb" />
        <div className="cv-head-txt">
          <div className="cv-title">AIに相談</div>
          <div className="cv-sub">診断結果をふまえて一緒に考えます</div>
        </div>
        <div className="cv-fs" role="group" aria-label="文字サイズ">
          {(["s", "m", "l"] as const).map((v) => (
            <button key={v} className={`cv-fs-btn${fs === v ? " on" : ""}`} onClick={() => chooseFs(v)} aria-pressed={fs === v}>
              <span style={{ fontSize: v === "s" ? 11 : v === "l" ? 17 : 14 }}>あ</span>
            </button>
          ))}
        </div>
      </div>

      <div className="cv-scroll" ref={scrollRef}>
        {msgs.map((m, i) => (
          <div className={`cv-msg ${m.role}`} key={i}>
            {m.role === "ai" && <span className="cv-av" />}
            <div className="cv-bubble">{m.role === "ai" ? renderHl(m.text) : m.text}</div>
          </div>
        ))}
        {busy && (
          <div className="cv-msg ai">
            <span className="cv-av" />
            <div className="cv-bubble"><span className="cv-typing"><i /><i /><i /></span></div>
          </div>
        )}
      </div>

      {!busy && suggests.length > 0 && (
        <div className="cv-suggests">
          {msgs.length > 1 && <span className="cv-suggests-lead">もっと詳しく聞く：</span>}
          {suggests.map((s) => (
            <button key={s} className="cv-suggest" onClick={() => send(s)} disabled={busy}>{s}</button>
          ))}
        </div>
      )}

      <div className="cv-inputbar">
        <textarea
          className="cv-input" rows={1} value={input} placeholder="メッセージを入力…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
        />
        <button className="cv-send" onClick={() => send(input)} disabled={busy || !input.trim()} aria-label="送信">
          <Icon name="mega" size={20} />
        </button>
      </div>
    </div>
  );
}
