"use client";

import { useState, useEffect } from "react";
import { timeAgo } from "@/lib/utils";

interface Article {
  symbol: string;
  publishedDate: string;
  title: string;
  image: string;
  site: string;
  text: string;
  url: string;
}

export default function NewsSection({ ticker }: { ticker?: string }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = ticker ? `/api/news?ticker=${ticker}` : "/api/news";
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setArticles(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [ticker]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
          style={{ background: "rgba(10, 132, 255, 0.12)", color: "#0a84ff" }}
        >
          N
        </div>
        <h2 className="text-lg font-bold tracking-tight" style={{ color: "#f5f5f7" }}>
          {ticker ? `${ticker} News` : "Market News"}
        </h2>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl shimmer"
              style={{ height: 90, border: "1px solid rgba(255,255,255,0.04)" }}
            />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div
          className="rounded-2xl p-6 text-center"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
        >
          <p className="text-sm" style={{ color: "#636366" }}>No news available</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {articles.slice(0, 12).map((article, i) => (
            <a
              key={i}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block glass-card rounded-2xl p-3.5 transition-all"
              style={{ textDecoration: "none" }}
            >
              <div className="flex gap-3">
                {article.image && (
                  <img
                    src={article.image}
                    alt=""
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                    style={{ border: "1px solid rgba(255,255,255,0.04)" }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h3
                    className="text-[13px] font-semibold mb-1.5 line-clamp-2 leading-snug"
                    style={{ color: "#e5e5e7" }}
                  >
                    {article.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px]" style={{ color: "#636366" }}>
                    <span className="font-medium">{article.site}</span>
                    <span style={{ opacity: 0.4 }}>|</span>
                    <span>{timeAgo(article.publishedDate)}</span>
                    {article.symbol && (
                      <>
                        <span style={{ opacity: 0.4 }}>|</span>
                        <span
                          className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-semibold"
                          style={{ background: "rgba(10, 132, 255, 0.1)", color: "#0a84ff" }}
                        >
                          {article.symbol}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
