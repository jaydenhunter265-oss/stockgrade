import type { Metadata } from "next";
import { Lato } from "next/font/google";
import "./globals.css";

const lato = Lato({
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "StockGrade - Professional Stock Evaluator",
  description: "Comprehensive stock evaluation using 350+ quantitative metrics. Get instant Buy/Sell ratings powered by institutional-grade analysis.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={lato.variable}>
      <body style={{ fontFamily: "var(--font-sans), Lato, system-ui, sans-serif" }}>{children}</body>
    </html>
  );
}
