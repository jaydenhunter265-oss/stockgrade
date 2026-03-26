"use client";

import { useState } from "react";

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  badge?: string | number;
  badgeColor?: string;
  children: React.ReactNode;
}

export default function CollapsibleSection({
  title,
  defaultOpen = false,
  badge,
  badgeColor = "var(--text-muted)",
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 pt-2 pb-1 group"
        style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.12em] flex-shrink-0"
          style={{ color: "var(--text-dim)" }}
        >
          {title}
        </span>
        {badge !== undefined && (
          <span
            className="text-[9px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.04)", color: badgeColor, border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {badge}
          </span>
        )}
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        <span
          className="text-[11px] font-mono flex-shrink-0 transition-transform duration-200 group-hover:opacity-80"
          style={{
            color: "var(--text-dim)",
            display: "inline-block",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          ▾
        </span>
        <span
          className="text-[9px] flex-shrink-0 transition-all"
          style={{ color: "var(--text-dim)" }}
        >
          {open ? "Hide" : "Show"}
        </span>
      </button>
      {open && <div className="mt-3 space-y-5 animate-fade-in">{children}</div>}
    </div>
  );
}
