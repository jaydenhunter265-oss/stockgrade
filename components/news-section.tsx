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
      <h2
        className="text-xl font-bold mb-4 flex items-center gap-2"
        style={{ color: "#fafafa" }}
      >
        <span style={{ color: "#3b82f6" }}>&#9679;</span>
        {ticker ? `${ticker} News` : "Market News"}
      </h2>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl p-4 shimmer"
              style={{ height: 88, border: "1px solid #262626" }}
            />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <p style={{ color: "#71717a" }}>No news available.</p>
      ) : (
        <div className="space-y-3">
          {articles.slice(0, 12).map((article, i) => (
            <a
              key={i}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl p-4 transition-colors hover:border-blue-500/30"
              style={{
                background: "#141414",
                border: "1px solid #262626",
                textDecoration: "none",
              }}
            >
              <div className="flex gap-3">
                {article.image && (
                  <img
                    src={article.image}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h3
                    className="text-sm font-semibold mb-1 line-clamp-2"
                    style={{ color: "#e4e4e7" }}
                  >
                    {article.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs" style={{ color: "#71717a" }}>
                    <span>{article.site}</span>
                    <span>&#183;</span>
                    <span>{timeAgo(article.publishedDate)}</span>
                    {article.symbol && (
                      <>
                        <span>&#183;</span>
                        <span
                          className="px-1.5 py-0.5 rounded text-xs font-mono"
                          style={{ background: "#1e3a5f", color: "#60a5fa" }}
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
