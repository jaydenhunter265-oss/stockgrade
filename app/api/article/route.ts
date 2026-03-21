import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing 'url' parameter" }, { status: 400 });
  }

  try {
    const response = await fetch(decodeURIComponent(url), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch article", content: null }, { status: 502 });
    }

    const html = await response.text();

    // Remove scripts, styles, nav, footer, aside
    let cleaned = html
      .replace(/<script\b[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[\s\S]*?<\/style>/gi, "")
      .replace(/<nav\b[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer\b[\s\S]*?<\/footer>/gi, "")
      .replace(/<aside\b[\s\S]*?<\/aside>/gi, "")
      .replace(/<header\b[\s\S]*?<\/header>/gi, "");

    // Try to find article content
    let articleHtml = "";
    const articleMatch = cleaned.match(/<article\b[\s\S]*?<\/article>/i);
    if (articleMatch) {
      articleHtml = articleMatch[0];
    } else {
      const mainMatch = cleaned.match(/<main\b[\s\S]*?<\/main>/i);
      if (mainMatch) {
        articleHtml = mainMatch[0];
      }
    }

    const source = articleHtml || cleaned;

    // Extract paragraphs
    const paragraphs = (source.match(/<p\b[^>]*>([\s\S]*?)<\/p>/gi) || [])
      .map((p) =>
        p
          .replace(/<[^>]+>/g, "")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#x27;/g, "'")
          .replace(/&#39;/g, "'")
          .replace(/\s+/g, " ")
          .trim()
      )
      .filter((p) => p.length > 30);

    if (paragraphs.length === 0) {
      return NextResponse.json({
        content: null,
        success: false,
        message: "Could not extract article content",
      });
    }

    return NextResponse.json({
      content: paragraphs.join("\n\n"),
      success: true,
    });
  } catch (error) {
    console.error("Article fetch error:", error);
    return NextResponse.json(
      { error: "Unable to load article content", content: null, success: false },
      { status: 500 }
    );
  }
}
