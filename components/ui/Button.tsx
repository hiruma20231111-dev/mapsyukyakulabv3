"use client";
import type { CSSProperties, ReactNode } from "react";
import { Icon, type IconName } from "@/design/icons";

type Variant = "primary" | "secondary" | "link";

export function Button({
  children,
  variant = "primary",
  icon,
  onClick,
  disabled,
  type = "button",
  style,
}: {
  children: ReactNode;
  variant?: Variant;
  icon?: IconName;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  style?: CSSProperties;
}) {
  return (
    <button
      type={type}
      className={`ui-btn ui-btn--${variant}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {icon && <Icon name={icon} size={19} />}
      {children}
    </button>
  );
}
