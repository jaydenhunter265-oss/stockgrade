import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StockGrade - AI Stock Evaluator",
  description: "Comprehensive stock evaluation using 350+ quantitative metrics. Get instant Buy/Sell ratings for any stock ticker.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
