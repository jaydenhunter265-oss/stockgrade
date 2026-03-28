import { getSimulation, getProject } from "@/lib/redis";
import { searchGraph } from "@/lib/zep";
import { llmStream } from "@/lib/llm";
import type { ModelMessage } from "@/lib/llm";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await req.json();
  const { simulation_id, message, chat_history = [] } = body;

  if (!simulation_id || !message) {
    return new Response(JSON.stringify({ error: "simulation_id and message required" }), { status: 400 });
  }

  const sim = await getSimulation(simulation_id);
  if (!sim) return new Response(JSON.stringify({ error: "Simulation not found" }), { status: 404 });

  const project = await getProject(sim.project_id);
  const simReq = project?.simulation_requirement ?? "";

  // Search graph for context relevant to the user's question
  const { facts } = await searchGraph(sim.graph_id, message, 10);
  const context = facts.slice(0, 8).join("\n");

  const s = sim.summary;
  const statsBlock = s
    ? `Simulation stats — Total posts: ${s.total_posts}, Bullish: ${s.bullish_count}, Bearish: ${s.bearish_count}, Neutral: ${s.neutral_count}, Sentiment score: ${s.sentiment_score}`
    : "";

  const systemMsg = `You are an expert analyst who ran a social media simulation about: "${simReq}".
${statsBlock}
Relevant knowledge graph facts:
${context || "(none found)"}
Answer questions using the simulation data. Be concise, insightful, and cite specific agents or posts where relevant.`;

  const messages: ModelMessage[] = [
    { role: "system", content: systemMsg },
    ...chat_history,
    { role: "user", content: message },
  ];

  const result = llmStream(messages);
  return (await result).toTextStreamResponse();
}
