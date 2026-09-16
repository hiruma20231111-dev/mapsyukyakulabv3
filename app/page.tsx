"use client";
// マップ集客ラボ v2 本体。v1 page.js の Page（統括）を feature 合成に置き換え。
import { useEffect, useState } from "react";
import { useAppStore } from "@/state/app-store";
import { DiagnosisScreen } from "@/features/diagnosis";
import { ConsultScreen } from "@/features/consult";
import { GuideScreen } from "@/features/guide";
import { Onboarding } from "@/features/onboarding";
import { FontSizeControl, TabBar, type Tab } from "@/components/ui";
import { fmtBg } from "@/features/diagnosis/util";

const TABS: Tab[] = [
  { key: "diag", icon: "search", label: "診断" },
  { key: "ai", icon: "chat", label: "相談" },
  { key: "guide", icon: "book", label: "ガイド" },
];

const EXPERT_URL =
  "https://maru-nage.jp/meo-ai-agent/?utm_source=meta&utm_medium=display&utm_campaign=260803_FB_AT_FUSION_260803_AT_FUSION&utm_term=lp001&utm_content=N014_static_1080-1080";

export default function Page() {
  const hydrate = useAppStore((s) => s.hydrate);
  const fs = useAppStore((s) => s.fs);
  const setFs = useAppStore((s) => s.setFs);
  const invite = useAppStore((s) => s.invite);
  const setInvite = useAppStore((s) => s.setInvite);
  const setCfg = useAppStore((s) => s.setCfg);
  const setBackground = useAppStore((s) => s.setBackground);
  const setBgInfo = useAppStore((s) => s.setBgInfo);
  const setAdvisorSetup = useAppStore((s) => s.setAdvisorSetup);

  const [tab, setTab] = useState("diag");
  const [pendingAsk, setPendingAsk] = useState<string | null>(null);
  const [gsel, setGsel] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [expired, setExpired] = useState(false);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  // 起動時：状態復元＋招待リンク（?k=TOKEN）判定
  useEffect(() => {
    hydrate();
    try {
      const url = new URL(window.location.href);
      const k = url.searchParams.get("k");
      let inv = "";
      if (k) {
        inv = k;
        setInvite(k);
      } else {
        inv = useAppStore.getState().invite;
      }
      if (inv && !useAppStore.getState().advisorSetup) setNeedsSetup(true);
      if (inv) {
        fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: inv }),
        })
          .then((r) => r.json())
          .then((d) => {
            if (d.expired || d.invalid) setExpired(true);
            else setDaysLeft(d.daysLeft);
          })
          .catch(() => {});
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 文字サイズ倍率を CSS 変数へ反映
  useEffect(() => {
    document.documentElement.style.setProperty("--fs", String(fs));
  }, [fs]);

  const finishSetup = async ({ dialect, tone, store }: { dialect: string; tone: string; store: string }) => {
    setCfg({ dialect, tone });
    if (store) {
      const { cfg } = useAppStore.getState();
      try {
        const r = await fetch("/api/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invite: invite || undefined, key: cfg.key || undefined, input: store }),
        });
        const d = await r.json();
        if (d.found) {
          const info = { ...d.info, query: d.query || store };
          setBgInfo(info);
          setBackground(fmtBg(info, store));
        } else {
          setBgInfo({ name: store });
          setBackground(`お店:${store}`);
        }
      } catch {
        setBackground(`お店:${store}`);
      }
    }
    setAdvisorSetup(true);
    setNeedsSetup(false);
  };

  if (expired) {
    return (
      <main className="app">
        <div className="o-hero" style={{ paddingBottom: 40 }}>
          <div className="o-hero__brand">📍 マップ集客ラボ</div>
          <h1 style={{ fontSize: 22 }}>この招待リンクは<br />有効期限が終了しました</h1>
        </div>
        <div className="o-sec">
          <div className="ui-card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, margin: "6px 0" }}>⏳</div>
            <p style={{ fontSize: 14, margin: "0 0 6px", fontWeight: 700 }}>お試し期間（設定日数）が終了しました。</p>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
              引き続き使いたい場合は、担当者に新しい招待リンクをご依頼ください。
            </p>
            <a className="ui-btn ui-btn--primary" style={{ textDecoration: "none", marginTop: 14 }} href={EXPERT_URL} target="_blank" rel="noreferrer">
              📩 相談・お問い合わせ
            </a>
          </div>
        </div>
      </main>
    );
  }

  if (needsSetup) return <Onboarding onDone={finishSetup} />;

  return (
    <main className="app">
      {invite && daysLeft != null && (
        <div
          style={{
            textAlign: "center",
            fontSize: 11.5,
            fontWeight: 700,
            padding: "5px 8px",
            background: daysLeft <= 3 ? "#fff6e6" : "var(--accent-soft)",
            color: daysLeft <= 3 ? "#c07a13" : "var(--accent-deep)",
          }}
        >
          🎫 お試し期間：残り{daysLeft}日
        </div>
      )}
      <FontSizeControl value={fs} onChange={setFs} />

      {tab === "diag" && (
        <DiagnosisScreen
          onAsk={(q) => {
            setPendingAsk(q ?? null);
            setTab("ai");
          }}
          onGuide={(gk) => {
            setGsel(gk);
            setTab("guide");
          }}
          onSettings={() => {
            window.location.href = "/settings";
          }}
        />
      )}
      {tab === "ai" && (
        <ConsultScreen
          pendingAsk={pendingAsk}
          onConsumeAsk={() => setPendingAsk(null)}
          onGoDiag={() => setTab("diag")}
          onOpenSettings={() => {
            window.location.href = "/settings";
          }}
        />
      )}
      {tab === "guide" && (
        <GuideScreen
          selected={gsel}
          onSelect={setGsel}
          onSettings={() => {
            window.location.href = "/settings";
          }}
        />
      )}

      <TabBar tabs={TABS} active={tab} onChange={setTab} />
    </main>
  );
}
