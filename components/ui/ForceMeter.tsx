import { forceColor, type LeverKey } from "@/design/tokens";

export interface ForceRow {
  key: LeverKey;
  label: string;
  /** 0-100 のスコア。null は未評価 */
  value: number | null;
}

// 強さは「バーの長さ＋強/中/弱」で示す（色はカテゴリ識別＝Google4色に専念）
function strengthLabel(v: number | null): string {
  if (v == null) return "—";
  return v >= 72 ? "強" : v >= 48 ? "中" : "弱";
}

export function ForceMeter({ forces }: { forces: readonly ForceRow[] }) {
  return (
    <div className="ui-forces">
      {forces.map((f) => {
        const c = forceColor[f.key];
        const w = f.value == null ? 0 : Math.max(0, Math.min(100, f.value));
        return (
          <div className="ui-force" key={f.key}>
            <span className="ui-force__dot" style={{ background: c }} />
            <span className="ui-force__nm">{f.label}</span>
            <span className="ui-force__bar">
              <i style={{ width: w + "%", background: c }} />
            </span>
            <span className="ui-force__v">{strengthLabel(f.value)}</span>
          </div>
        );
      })}
    </div>
  );
}
