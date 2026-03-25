import type { Metadata } from "next";
import { Tomorrow } from "next/font/google";
import "./globals.css";

const tomorrow = Tomorrow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "StockGrade - Professional Stock Evaluator",
  description: "Comprehensive stock evaluation using 350+ quantitative metrics. Get instant Buy/Sell ratings powered by institutional-grade analysis.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={tomorrow.variable}>
      <body style={{ fontFamily: "var(--font-sans), Tomorrow, system-ui, sans-serif" }}>{children}</body>
    </html>
  );
}
