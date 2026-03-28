import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import { z } from "zod";
import { createProject, saveProject, saveProjectText } from "@/lib/redis";
import { llmJson } from "@/lib/llm";
import type { ModelMessage } from "@/lib/llm";

export const runtime = "nodejs";
export const maxDuration = 120;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(yf as any)._opts.validation.logErrors = false;

const OntologySchema = z.object({
  entity_types: z.array(z.object({
    name: z.string(),
    description: z.string(),
    attributes: z.array(z.object({
      name: z.string(),
      type: z.string(),
      description: z.string(),
    })).default([]),
    examples: z.array(z.string()).default([]),
  })),
  edge_types: z.array(z.object({
    name: z.string(),
    description: z.string(),
    source_targets: z.array(z.object({ source: z.string(), target: z.string() })).default([]),
    attributes: z.array(z.object({
      name: z.string(),
      type: z.string(),
      description: z.string(),
    })).default([]),
  })),
  analysis_summary: z.string().default(""),
});

const ONTOLOGY_SYSTEM = `You are a knowledge graph ontology expert. Analyze the stock data and simulation requirement to design entity types and relationship types for a social media opinion simulation about the stock's future.

RULES:
- Output exactly 10 entity types. The last 2 MUST be "Person" (individual fallback) and "Organization" (org fallback).
- Output 6-10 edge types representing social media interactions and market reactions.
- All entity types must be real-world actors that can post/interact on social media (no abstract concepts).
- Attribute names must NOT use: name, uuid, group_id, created_at, summary (reserved).
- Keep description fields under 100 characters.

Output valid JSON only. No markdown fences.`;

export async function POST(req: Request) {
  try {
    const { ticker } = await req.json();
    if (!ticker || typeof ticker !== "string") {
      return NextResponse.json({ success: false, error: "ticker required" }, { status: 400 });
    }

    const symbol = ticker.trim().toUpperCase();

    // Fetch Yahoo Finance data
    let quoteText = "";
    let newsText = "";
    let companyName = symbol;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const quote: any = await yf.quote(symbol);
      companyName = quote.longName || quote.shortName || symbol;
      quoteText = `
=== COMPANY OVERVIEW ===
Ticker: ${symbol}
Company: ${companyName}
Sector: ${quote.sector ?? "N/A"}
Industry: ${quote.industry ?? "N/A"}
Market Cap: ${quote.marketCap ? `$${(quote.marketCap / 1e9).toFixed(2)}B` : "N/A"}
Current Price: ${quote.regularMarketPrice ?? "N/A"}
52-Week High: ${quote.fiftyTwoWeekHigh ?? "N/A"}
52-Week Low: ${quote.fiftyTwoWeekLow ?? "N/A"}
P/E Ratio: ${quote.trailingPE ?? "N/A"}
Forward P/E: ${quote.forwardPE ?? "N/A"}
EPS (TTM): ${quote.epsTrailingTwelveMonths ?? "N/A"}
Revenue (TTM): ${quote.revenueGrowth ? `${(quote.revenueGrowth * 100).toFixed(1)}% growth` : "N/A"}
Dividend Yield: ${quote.dividendYield ? `${(quote.dividendYield * 100).toFixed(2)}%` : "N/A"}
Beta: ${quote.beta ?? "N/A"}
Short % of Float: ${quote.shortPercentOfFloat ? `${(quote.shortPercentOfFloat * 100).toFixed(1)}%` : "N/A"}
Analyst Rating: ${quote.averageAnalystRating ?? "N/A"}
`;
    } catch {
      quoteText = `=== COMPANY OVERVIEW ===\nTicker: ${symbol}\n`;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const searchResult: any = await yf.search(symbol, { newsCount: 15, quotesCount: 0 });
      const articles = searchResult.news || [];
      if (articles.length > 0) {
        newsText = "\n=== RECENT NEWS ===\n";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        articles.forEach((a: any, i: number) => {
          newsText += `\n[${i + 1}] ${a.title ?? ""}`;
          if (a.publisher) newsText += ` (${a.publisher})`;
          if (a.providerPublishTime) {
            newsText += ` — ${new Date(a.providerPublishTime * 1000).toLocaleDateString()}`;
          }
          newsText += "\n";
        });
      }
    } catch {
      // no news available
    }

    const documentText = quoteText + newsText;
    const simReq = `Simulate the future market outlook for ${companyName} (${symbol}). Model how investors, analysts, media, short sellers, and retail traders will react to this company's financial position and recent developments over the next 6–12 months. Generate a prediction of likely price direction and key risk/opportunity factors.`;

    // Create project in Redis
    const project = await createProject(`${symbol} — Future Simulation`, simReq);
    project.files.push({ filename: `${symbol}_market_data.txt`, size: documentText.length });
    project.total_text_length = documentText.length;
    await saveProjectText(project.project_id, documentText);

    // Build ontology via LLM
    const MAX = 50000;
    const messages: ModelMessage[] = [
      { role: "system", content: ONTOLOGY_SYSTEM },
      {
        role: "user",
        content: `## Simulation Requirement\n${simReq}\n\n## Stock Data\n${documentText.slice(0, MAX)}\n\nDesign the ontology for the social media simulation.`,
      },
    ];

    const ontology = await llmJson(messages, OntologySchema, { temperature: 0.3 });

    // Enforce Person + Organization fallback types
    const names = new Set(ontology.entity_types.map((e) => e.name));
    if (!names.has("Person")) {
      ontology.entity_types.push({ name: "Person", description: "Any individual person.", attributes: [{ name: "full_name", type: "text", description: "Full name" }, { name: "role", type: "text", description: "Role" }], examples: ["ordinary investor"] });
    }
    if (!names.has("Organization")) {
      ontology.entity_types.push({ name: "Organization", description: "Any organization.", attributes: [{ name: "org_name", type: "text", description: "Organization name" }], examples: ["hedge fund"] });
    }
    ontology.entity_types = ontology.entity_types.slice(0, 10);
    ontology.edge_types = ontology.edge_types.slice(0, 10);

    project.ontology = { entity_types: ontology.entity_types, edge_types: ontology.edge_types };
    project.analysis_summary = ontology.analysis_summary;
    project.status = "ontology_generated";
    await saveProject(project);

    return NextResponse.json({
      success: true,
      data: {
        project_id: project.project_id,
        project_name: project.name,
        ticker: symbol,
        company_name: companyName,
        analysis_summary: project.analysis_summary,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
