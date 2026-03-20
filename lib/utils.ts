export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatNumber(num: number | null | undefined): string {
  if (num == null || isNaN(num)) return "N/A";
  if (Math.abs(num) >= 1e12) return (num / 1e12).toFixed(2) + "T";
  if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(2) + "K";
  return num.toFixed(2);
}

export function formatPercent(num: number | null | undefined): string {
  if (num == null || isNaN(num)) return "N/A";
  return (num * 100).toFixed(2) + "%";
}

export function formatPercentRaw(num: number | null | undefined): string {
  if (num == null || isNaN(num)) return "N/A";
  return num.toFixed(2) + "%";
}

export function getRatingColor(rating: string): string {
  switch (rating) {
    case "STRONG BUY": return "#22c55e";
    case "BUY": return "#4ade80";
    case "HOLD": return "#f59e0b";
    case "UNDERWEIGHT": return "#f97316";
    case "SELL": return "#ef4444";
    default: return "#a1a1aa";
  }
}

export function getRatingFromScore(score: number): {
  rating: "STRONG BUY" | "BUY" | "HOLD" | "UNDERWEIGHT" | "SELL";
  color: string;
} {
  if (score >= 75) return { rating: "STRONG BUY", color: "#22c55e" };
  if (score >= 55) return { rating: "BUY", color: "#4ade80" };
  if (score >= 35) return { rating: "HOLD", color: "#f59e0b" };
  if (score >= 15) return { rating: "UNDERWEIGHT", color: "#f97316" };
  return { rating: "SELL", color: "#ef4444" };
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return Math.floor(seconds / 60) + "m ago";
  if (seconds < 86400) return Math.floor(seconds / 3600) + "h ago";
  if (seconds < 604800) return Math.floor(seconds / 86400) + "d ago";
  return date.toLocaleDateString();
}
