"use client";

const OPTS: [string, number][] = [["小", 0.9], ["中", 1], ["大", 1.18]];

export function FontSizeControl({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="ui-fsbar">
      <span className="ui-fsbar__l">文字サイズ</span>
      <div className="ui-fsseg">
        {OPTS.map(([label, v]) => (
          <button key={label} className={Math.abs(value - v) < 0.01 ? "on" : ""} onClick={() => onChange(v)}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
