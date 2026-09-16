"use client";
// 営業モード：GBP状況を5項目で入力 → 発行（AI精査→保存→固有URL/QR）。
import { useMemo, useState } from "react";
import QRCode from "qrcode";
import { Icon, type IconName } from "@/design/icons";
import { DIAG_CATEGORIES, type CategoryKey } from "@/content/diagnosis-v3";
import type { V3Answers } from "@/lib/domain/score";

type Step = "input" | "issuing" | "issued";
type CatAns = Record<string, number | null>;
type Answers = Record<CategoryKey, CatAns>;

const ICON: Record<CategoryKey, IconName> = {
  profile: "list", photo: "camera", review: "chat", post: "mega", citation: "link",
};

/** AIの精査に使う任意のGemini資格情報（招待 or キー）。無ければ手入力採点。 */
export interface IntakeCreds { key?: string; invite?: string }

function emptyAnswers(): Answers {
  const a = {} as Answers;
  for (const c of DIAG_CATEGORIES) a[c.key] = {};
  return a;
}

export function IntakeFlow({ creds }: { creds?: IntakeCreds }) {
  const [step, setStep] = useState<Step>("input");
  const [storeName, setStoreName] = useState("");
  const [answers, setAnswers] = useState<Answers>(emptyAnswers);
  const [site, setSite] = useState("");
  const [others, setOthers] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiRes, setAiRes] = useState<{ tags: string[]; note: string } | null>(null);
  const [slug, setSlug] = useState("");
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);

  const setSub = (cat: CategoryKey, sub: string, score: number) =>
    setAnswers((prev) => ({ ...prev, [cat]: { ...prev[cat], [sub]: prev[cat][sub] === score ? null : score } }));

  // 入力の完了度（発行ボタンの有効化に使う）
  const answeredCount = useMemo(
    () => Object.values(answers).reduce((n, c) => n + Object.values(c).filter((v) => typeof v === "number").length, 0),
    [answers],
  );
  const canIssue = storeName.trim().length > 0 && answeredCount >= 5;

  async function runAiCitation() {
    setAiBusy(true);
    setAiRes(null);
    try {
      const r = await fetch("/api/citation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeName, site, others, key: creds?.key, invite: creds?.invite }),
      });
      const d = await r.json();
      if (d?.ok && d.scores) {
        setAnswers((prev) => ({ ...prev, citation: { nap: d.scores.nap, media: d.scores.media, sns: d.scores.sns } }));
        setAiRes({ tags: d.tags || [], note: d.note || "精査が完了しました。必要なら下のチップで微調整してください。" });
      } else {
        setAiRes({ tags: [], note: d?.note || d?.error || "手入力で採点してください。" });
      }
    } catch {
      setAiRes({ tags: [], note: "通信エラー。手入力で採点してください。" });
    } finally {
      setAiBusy(false);
    }
  }

  async function issue() {
    setStep("issuing");
    try {
      const r = await fetch("/api/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeName, answers, query: storeName }),
      });
      const d = await r.json();
      const path: string = d?.path || (d?.slug ? `/d/${d.slug}` : "");
      const url = typeof window !== "undefined" ? window.location.origin + path : path;
      setSlug(path);
      try { setQr(await QRCode.toDataURL(url, { margin: 1, width: 320 })); } catch { /* noop */ }
      // 発行完了まで少し“見せる”
      setTimeout(() => setStep("issued"), 900);
    } catch {
      setStep("input");
      alert("発行に失敗しました。時間をおいて再度お試しください。");
    }
  }

  const fullUrl = typeof window !== "undefined" ? window.location.origin + slug : slug;

  if (step === "issuing") {
    return (
      <div className="in-issue">
        <div className="in-orb"><span className="core"><Icon name="search" size={30} /></span></div>
        <div className="in-prog-t">AIが診断を作成中…</div>
        <div className="in-prog-s">採点とQRの生成をしています</div>
        <div className="in-steps">
          <div className="in-step done"><span className="dot"><Icon name="check" size={13} /></span><span className="t">入力内容を保存</span></div>
          <div className="in-step done"><span className="dot"><Icon name="check" size={13} /></span><span className="t">5項目の採点を計算</span></div>
          <div className="in-step now"><span className="dot" /><span className="t">固有URLとQRを生成</span></div>
        </div>
      </div>
    );
  }

  if (step === "issued") {
    return (
      <div className="in-issue">
        <span className="in-role-hint">営業モード</span>
        <div className="in-done-badge"><Icon name="check" size={34} /></div>
        <div className="in-done-h">発行が完了しました</div>
        <div className="in-done-s">このQR / リンクをお客様にお渡しください</div>
        {qr ? <div className="in-qr"><img src={qr} alt="診断ページのQRコード" /></div> : null}
        <div className="in-urlpill"><Icon name="link" size={15} />{fullUrl}</div>
        <div className="in-share">
          <a className="btn" href={slug} target="_blank" rel="noreferrer" style={{ display: "grid", placeItems: "center", textDecoration: "none" }}>結果ページを開く</a>
          <button
            className="btn ghost" title="リンクをコピー"
            onClick={async () => { try { await navigator.clipboard.writeText(fullUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* noop */ } }}
          >
            <Icon name={copied ? "check" : "link"} size={18} />
          </button>
        </div>
      </div>
    );
  }

  // step === "input"
  return (
    <div className="in-wrap">
      <div className="in-appbar">
        <span className="mk"><i className="b" /><i className="y" /><i className="g" /><i className="r" /></span>
        <span className="name">マップ集客ラボ</span>
        <span className="role">営業モード</span>
      </div>
      <div className="in-h">GBP診断を作成</div>
      <div className="in-hsub">お客様のお店の現状を入力してください</div>

      <div className="in-field">
        <label>対象店舗名</label>
        <input className="in-input" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="例：美容室 LURE 中目黒店" />
      </div>

      {DIAG_CATEGORIES.map((cat) => (
        <div className="in-cat" key={cat.key}>
          <div className="in-cat-head">
            <span className="in-cat-ic"><Icon name={ICON[cat.key]} size={17} /></span>
            <span className="in-cat-name">{cat.name}</span>
            <span className="in-cat-pts">配点 {cat.max}</span>
          </div>

          {cat.key === "citation" && (
            <>
              <div className="in-sub" style={{ borderTop: 0 }}>
                <div className="in-sub-lbl">公式サイト / LP</div>
                <input className="in-input" value={site} onChange={(e) => setSite(e.target.value)} placeholder="例：lure-hair.jp" />
              </div>
              <div className="in-sub" style={{ borderTop: 0 }}>
                <div className="in-sub-lbl">他媒体・SNS（任意）</div>
                <input className="in-input" value={others} onChange={(e) => setOthers(e.target.value)} placeholder="例：ホットペッパー / Instagram @…" />
              </div>
              <div className="in-ai">
                <div className="in-ai-top"><Icon name="spark" size={15} />AIがWeb検索で精査</div>
                <button className="in-ai-btn" onClick={runAiCitation} disabled={aiBusy || !storeName.trim()}>
                  <Icon name="search" size={14} />{aiBusy ? "精査中…" : "AIで精査する"}
                </button>
                {aiRes && (
                  <div className="in-ai-res">
                    {aiRes.tags.length > 0 && <div className="in-ai-tags">{aiRes.tags.map((t, i) => <span className="in-tag" key={i}>{t}</span>)}</div>}
                    {aiRes.note}
                    <div className="in-ai-note">※ AIの採点は「案」です。下のチップで微調整して確定してください。</div>
                  </div>
                )}
              </div>
            </>
          )}

          {cat.subs.map((sub) => (
            <div className="in-sub" key={sub.key}>
              <div className="in-sub-lbl">{sub.label}<span style={{ color: "var(--faint)", fontWeight: 600 }}>（基準：{sub.criteria}）</span></div>
              <div className="in-chips">
                {sub.options.map((opt) => (
                  <button
                    key={opt.label}
                    className={`in-chip${answers[cat.key][sub.key] === opt.score ? " on" : ""}`}
                    onClick={() => setSub(cat.key, sub.key, opt.score)}
                    type="button"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}

      <div className="in-cta">
        <button className="btn" onClick={issue} disabled={!canIssue}>
          <Icon name="pin" size={18} />URL / QR を発行する
        </button>
        <p className="note">{canIssue ? "発行後、お客様に渡せる固有リンクとQRが作られます" : "店舗名と各項目を入力すると発行できます"}</p>
      </div>
    </div>
  );
}
