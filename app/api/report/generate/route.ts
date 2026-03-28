import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getProject, getSimulation, saveReport, createTask, updateTask } from "@/lib/redis";
import { searchGraph } from "@/lib/zep";
import { llmText } from "@/lib/llm";
import type { Report, Simulation } from "@/lib/workflow-types";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { simulation_id } = body;
    if (!simulation_id) {
      return NextResponse.json({ success: false, error: "simulation_id required" }, { status: 400 });
    }

    const sim = await getSimulation(simulation_id);
    if (!sim) {
      return NextResponse.json({ success: false, error: "Simulation not found" }, { status: 404 });
    }

    const project = await getProject(sim.project_id);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    const reportId = `report_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
    const task = await createTask("report_generate");

    const report: Report = {
      report_id: reportId,
      simulation_id,
      project_id: sim.project_id,
      status: "generating",
      markdown_content: "",
      outline: [],
      error: null,
      created_at: new Date().toISOString(),
      completed_at: null,
    };
    await saveReport(report);

    generateReportBackground({ report, sim, simReq: project.simulation_requirement, taskId: task.task_id });

    return NextResponse.json({
      success: true,
      data: { report_id: reportId, task_id: task.task_id, status: "generating" },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

async function generateReportBackground({
  report, sim, simReq, taskId,
}: {
  report: Report;
  sim: Simulation;
  simReq: string;
  taskId: string;
}) {
  try {
    await updateTask(taskId, { status: "processing", message: "Searching knowledge graph…", progress: 5 });

    const { facts } = await searchGraph(sim.graph_id, simReq, 30);
    const factContext = facts.slice(0, 25).join("\n");

    const postSummary = sim.posts
      .slice(0, 40)
      .map((p) => `[${p.entity_type} @${p.agent_name} on ${p.platform}] ${p.content}`)
      .join("\n");

    const s = sim.summary!;
    const statsBlock = s
      ? `Total Posts: ${s.total_posts} | Bullish: ${s.bullish_count} | Bearish: ${s.bearish_count} | Neutral: ${s.neutral_count} | Sentiment Score: ${s.sentiment_score}`
      : "";

    const sections = [
      { title: "Executive Summary", prompt: `Write a concise executive summary of the social media simulation analysis for: "${simReq}". Cover the overall findings and key takeaways in 2-3 paragraphs.` },
      { title: "Simulation Background", prompt: `Describe the simulation context, the agents involved (entity types: ${sim.agents.map(a => a.entity_type).join(", ")}), and the methodology used.` },
      { title: "Key Findings", prompt: `Analyse the key findings from the simulation. ${statsBlock}\nKey themes: ${s?.key_themes?.join(", ") ?? ""}.\nHighlight the most significant insights.` },
      { title: "Sentiment Analysis", prompt: `Provide a detailed sentiment analysis breakdown:\n${statsBlock}\nDiscuss what's driving bullish/bearish/neutral sentiment and what this means for the topic.` },
      { title: "Agent Perspectives", prompt: `Summarise the perspectives from different agent types in the simulation:\n${postSummary}\nHow do different stakeholder groups view this topic?` },
      { title: "Knowledge Graph Insights", prompt: `Discuss insights from the knowledge graph analysis:\n${factContext}\nWhat relationships and patterns were discovered?` },
      { title: "Implications & Recommendations", prompt: `Based on all findings, what are the key implications and actionable recommendations for stakeholders regarding: "${simReq}"?` },
    ];

    const mdSections: string[] = [];

    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      await updateTask(taskId, {
        progress: 10 + Math.round(((i + 1) / sections.length) * 80),
        message: `Writing section: ${sec.title}…`,
      });

      const content = await llmText(
        [
          { role: "system", content: `You are a senior financial and social media analyst writing a professional report section. Write in clear, professional markdown. Use subheadings, bullet points, and bold text where appropriate. Be specific and data-driven.` },
          { role: "user", content: `Write the "${sec.title}" section of the report.\n\nContext:\n${sec.prompt}\n\nFacts from knowledge base:\n${factContext.slice(0, 3000)}` },
        ],
        { temperature: 0.5, maxOutputTokens: 1500 }
      );

      mdSections.push(`## ${sec.title}\n\n${content}`);
    }

    const fullMarkdown = `# Simulation Analysis Report\n\n**Topic:** ${simReq}\n\n**Generated:** ${new Date().toLocaleDateString()}\n\n---\n\n${mdSections.join("\n\n---\n\n")}`;

    report.markdown_content = fullMarkdown;
    report.outline = sections.map((s) => s.title);
    report.status = "completed";
    report.completed_at = new Date().toISOString();
    await saveReport(report);

    await updateTask(taskId, {
      status: "completed",
      message: "Report generated",
      progress: 100,
      result: { report_id: report.report_id },
    });
  } catch (err) {
    report.status = "failed";
    report.error = String(err);
    await saveReport(report);
    await updateTask(taskId, { status: "failed", message: String(err), error: String(err) });
  }
}
