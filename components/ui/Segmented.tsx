"use client";

export interface SegOption {
  label: string;
  value: string | number;
}

export function Segmented({
  options,
  selected,
  multi,
  onSelect,
}: {
  options: readonly SegOption[];
  /** 選択中の値（単一でも配列で渡す） */
  selected: readonly (string | number)[];
  multi?: boolean;
  onSelect: (value: string | number) => void;
}) {
  return (
    <div className={"ui-seg" + (multi ? " ui-seg--multi" : "")}>
      {options.map((o) => {
        const on = selected.includes(o.value);
        return (
          <button key={String(o.value)} className={on ? "on" : ""} onClick={() => onSelect(o.value)}>
            {multi && on ? "✓ " : ""}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
