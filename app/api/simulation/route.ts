import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getProject, saveProject, saveSimulation, createTask, updateTask } from "@/lib/redis";
import { searchGraph } from "@/lib/zep";
import { llmText } from "@/lib/llm";
import type { Simulation, SimulationAgent, SimulationPost, SimulationSummary } from "@/lib/workflow-types";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { project_id, num_agents = 8, rounds = 2 } = body;

    if (!project_id) {
      return NextResponse.json({ success: false, error: "project_id required" }, { status: 400 });
    }

    const project = await getProject(project_id);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }
    if (!project.graph_id) {
      return NextResponse.json({ success: false, error: "Build graph first" }, { status: 400 });
    }

    const task = await createTask("simulation");
    const simId = `sim_${randomUUID().replace(/-/g, "").slice(0, 12)}`;

    const sim: Simulation = {
      simulation_id: simId,
      project_id,
      graph_id: project.graph_id,
      status: "pending",
      agents: [],
      posts: [],
      summary: null,
      error: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await saveSimulation(sim);

    project.status = "simulation_running";
    project.simulation_id = simId;
    await saveProject(project);

    runSimulationBackground({ sim, project, taskId: task.task_id, numAgents: num_agents, rounds });

    return NextResponse.json({
      success: true,
      data: { simulation_id: simId, task_id: task.task_id, message: "Simulation started" },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

async function runSimulationBackground({
  sim, project, taskId, numAgents, rounds,
}: {
  sim: Simulation;
  project: Awaited<ReturnType<typeof getProject>>;
  taskId: string;
  numAgents: number;
  rounds: number;
}) {
  try {
    await updateTask(taskId, { status: "processing", message: "Searching knowledge graph…", progress: 5 });

    const { facts } = await searchGraph(sim.graph_id, project!.simulation_requirement, 20);
    const factSummary = facts.slice(0, 15).join("\n");

    await updateTask(taskId, { message: "Creating agent profiles…", progress: 15 });

    // Determine entity types from ontology
    const entityTypes = project!.ontology?.entity_types
      .filter((e) => e.name !== "Person" && e.name !== "Organization")
      .slice(0, numAgents) ?? [];

    const allEntityNames = project!.ontology?.entity_types.map((e) => e.name) ?? ["Person", "Organization"];
    const agents: SimulationAgent[] = [];

    for (let i = 0; i < numAgents; i++) {
      const entityType = entityTypes[i % entityTypes.length]?.name ?? allEntityNames[i % allEntityNames.length];
      const profilePrompt = `You are ${entityType} agent in a social media simulation about: "${project!.simulation_requirement}".
Create a realistic profile for this agent. Key facts from knowledge base:
${factSummary}

Respond with ONLY a JSON object:
{"name":"<realistic name>","description":"<2 sentence background>"}`;

      const profileText = await llmText(
        [{ role: "user", content: profilePrompt }],
        { temperature: 0.9, maxOutputTokens: 256 }
      );

      let profile: { name: string; description: string } = { name: `Agent_${i + 1}`, description: "" };
      try {
        const cleaned = profileText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
        profile = JSON.parse(cleaned);
      } catch { /* fallback */ }

      agents.push({
        agent_id: `agent_${randomUUID().replace(/-/g, "").slice(0, 8)}`,
        entity_type: entityType,
        name: profile.name,
        description: profile.description,
        posts: [],
      });

      const pct = 15 + Math.round(((i + 1) / numAgents) * 20);
      await updateTask(taskId, { progress: pct, message: `Created agent ${i + 1}/${numAgents}` });
    }

    sim.agents = agents;

    // Run simulation rounds
    const allPosts: SimulationPost[] = [];
    const platforms = ["Twitter/X", "Reddit", "LinkedIn", "News Comments"];

    for (let round = 0; round < rounds; round++) {
      for (let ai = 0; ai < agents.length; ai++) {
        const agent = agents[ai];
        const platform = platforms[Math.floor(Math.random() * platforms.length)];
        const prevContext = allPosts.slice(-5).map((p) => `@${p.agent_name}: ${p.content}`).join("\n");

        const postPrompt = `You are ${agent.name} (${agent.entity_type}): ${agent.description}
Topic: "${project!.simulation_requirement}"
Recent discussion:
${prevContext || "(none yet)"}

Write a realistic social media post on ${platform}. Be specific, authentic to your role, and take a clear stance.
Respond with ONLY JSON: {"content":"<post text>","sentiment":"bullish"|"bearish"|"neutral"}`;

        const postText = await llmText(
          [{ role: "user", content: postPrompt }],
          { temperature: 1.0, maxOutputTokens: 256 }
        );

        let postData: { content: string; sentiment: "bullish" | "bearish" | "neutral" } = {
          content: postText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim(),
          sentiment: "neutral",
        };
        try {
          const cleaned = postText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
          postData = JSON.parse(cleaned);
        } catch { /* use raw text */ }

        const post: SimulationPost = {
          agent_id: agent.agent_id,
          agent_name: agent.name,
          entity_type: agent.entity_type,
          platform,
          content: postData.content,
          sentiment: postData.sentiment,
          timestamp: new Date().toISOString(),
          likes: Math.floor(Math.random() * 500),
          shares: Math.floor(Math.random() * 100),
        };

        allPosts.push(post);
        agent.posts.push(post);

        const pct = 35 + Math.round(((round * agents.length + ai + 1) / (rounds * agents.length)) * 50);
        await updateTask(taskId, {
          progress: pct,
          message: `Round ${round + 1}/${rounds} — agent ${ai + 1}/${agents.length}`,
        });
      }
    }

    sim.posts = allPosts;

    // Compute summary
    await updateTask(taskId, { message: "Synthesising summary…", progress: 90 });
    const bullish = allPosts.filter((p) => p.sentiment === "bullish").length;
    const bearish = allPosts.filter((p) => p.sentiment === "bearish").length;
    const neutral = allPosts.length - bullish - bearish;
    const sentimentScore = (bullish - bearish) / Math.max(allPosts.length, 1);

    const themePrompt = `Simulation topic: "${project!.simulation_requirement}"
Posts:\n${allPosts.slice(0, 20).map((p) => p.content).join("\n")}

List the top 5 key themes from these posts. Respond with JSON array of strings only.`;
    const themeText = await llmText([{ role: "user", content: themePrompt }], { temperature: 0.3 });
    let themes: string[] = [];
    try {
      const cleaned = themeText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      themes = JSON.parse(cleaned);
    } catch { themes = []; }

    const summary: SimulationSummary = {
      total_posts: allPosts.length,
      bullish_count: bullish,
      bearish_count: bearish,
      neutral_count: neutral,
      key_themes: themes.slice(0, 5),
      sentiment_score: parseFloat(sentimentScore.toFixed(3)),
    };

    sim.summary = summary;
    sim.status = "completed";
    sim.updated_at = new Date().toISOString();
    await saveSimulation(sim);

    if (project) {
      project.status = "simulation_completed";
      await saveProject(project);
    }

    await updateTask(taskId, {
      status: "completed",
      message: "Simulation complete",
      progress: 100,
      result: { simulation_id: sim.simulation_id, total_posts: allPosts.length, sentiment_score: sentimentScore },
    });
  } catch (err) {
    sim.status = "failed";
    sim.error = String(err);
    await saveSimulation(sim);
    await updateTask(taskId, { status: "failed", message: String(err), error: String(err) });
  }
}
