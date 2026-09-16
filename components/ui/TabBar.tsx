"use client";
import { Icon, type IconName } from "@/design/icons";

export interface Tab {
  key: string;
  icon: IconName;
  label: string;
}

export function TabBar({
  tabs,
  active,
  onChange,
}: {
  tabs: readonly Tab[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <nav className="ui-tabbar">
      {tabs.map((t) => (
        <button key={t.key} className={active === t.key ? "on" : ""} onClick={() => onChange(t.key)}>
          <Icon name={t.icon} size={21} />
          {t.label}
        </button>
      ))}
    </nav>
  );
}
