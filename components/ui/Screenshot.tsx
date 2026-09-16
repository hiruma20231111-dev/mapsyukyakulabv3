// 実スクショ＋赤枠オーバーレイ / スクショが無いときの操作イメージ図。v1 Shot・HowTo を移植。
// ※「赤い枠＝触るところ」はガイド本文が参照する指示語なので、赤(danger)を意図的に維持。

export interface ShotBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function Screenshot({ src, box, cap }: { src: string; box?: ShotBox; cap?: string }) {
  return (
    <div className="ui-howto">
      <div className="ui-howto__cap">{cap || "操作画面（赤い枠が「触るところ」）"}</div>
      <div style={{ position: "relative" }}>
        <img src={src} alt="操作画面" />
        {box && (
          <span
            style={{
              position: "absolute",
              left: box.x + "%",
              top: box.y + "%",
              width: box.w + "%",
              height: box.h + "%",
              border: "3px solid var(--danger)",
              borderRadius: 8,
              boxShadow: "0 0 0 3px rgba(224,87,74,.25)",
            }}
          />
        )}
      </div>
    </div>
  );
}

export function HowToDiagram({ hilite, title }: { hilite?: string; title?: string }) {
  if (!hilite) return null;
  return (
    <div className="ui-howto">
      <div className="ui-howto__cap">操作イメージ（赤い枠が「触るところ」）</div>
      <svg viewBox="0 0 320 190" role="img" aria-label="操作イメージ図" style={{ width: "100%" }}>
        <rect x="8" y="6" width="304" height="178" rx="16" fill="var(--panel)" stroke="var(--line)" />
        <rect x="8" y="6" width="304" height="34" rx="16" fill="var(--navy)" />
        <text x="22" y="28" fill="#fff" fontSize="13" fontWeight="700">{title || "お店のページ"}</text>
        <rect x="20" y="52" width="280" height="26" rx="7" fill="var(--line)" />
        <text x="32" y="69" fill="var(--faint)" fontSize="12">メニュー項目</text>
        <rect x="20" y="86" width="280" height="34" rx="8" fill="var(--surface)" stroke="var(--danger)" strokeWidth="2.5" />
        <text x="34" y="107" fill="var(--ink)" fontSize="13" fontWeight="800">{hilite}</text>
        <circle cx="286" cy="103" r="11" fill="var(--danger)" />
        <text x="286" y="107" fill="#fff" fontSize="12" fontWeight="800" textAnchor="middle">1</text>
        <rect x="20" y="128" width="280" height="26" rx="7" fill="var(--line)" />
        <text x="32" y="145" fill="var(--faint)" fontSize="12">メニュー項目</text>
      </svg>
    </div>
  );
}
