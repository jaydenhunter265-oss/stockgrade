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
        className="w-full flex items-center gap-3 py-2.5 px-4 rounded-xl group transition-all duration-150 hover:brightness-110"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        {/* Accent dot */}
        <div
          className="w-1 h-1 rounded-full flex-shrink-0"
          style={{ background: "var(--accent)", opacity: open ? 1 : 0.5 }}
        />
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.1em] flex-shrink-0"
          style={{ color: open ? "var(--text-secondary)" : "var(--text-dim)" }}
        >
          {title}
        </span>
        {badge !== undefined && (
          <span
            className="text-[9px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
            style={{
              background: "rgba(255,255,255,0.04)",
              color: badgeColor,
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {badge}
          </span>
        )}
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        <span
          className="text-[9px] font-mono flex-shrink-0 transition-all"
          style={{ color: "var(--text-dim)" }}
        >
          {open ? "Collapse" : "Expand"}
        </span>
        <span
          className="text-[11px] font-mono flex-shrink-0 transition-transform duration-200"
          style={{
            color: "var(--text-dim)",
            display: "inline-block",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          ▾
        </span>
      </button>
      {open && <div className="mt-3 space-y-5 animate-fade-in">{children}</div>}
    </div>
  );
}
