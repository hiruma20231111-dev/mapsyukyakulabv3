"use client";
import { Icon } from "@/design/icons";

// ヒーロー右上の設定ギア。/settings（→ /admin）への導線。v1 の <Gear/> を移植。
export function Gear({ onClick }: { onClick?: () => void }) {
  return (
    <button className="ui-gear" onClick={onClick} aria-label="設定">
      <Icon name="gear" size={18} />
    </button>
  );
}
