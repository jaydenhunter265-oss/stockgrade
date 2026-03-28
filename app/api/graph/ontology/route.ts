import { NextResponse } from "next/server";
import { z } from "zod";
import { isAllowedFile, extractText, preprocessText } from "@/lib/pdf";
import { llmJson } from "@/lib/llm";
import { createProject, saveProject, saveProjectText, getProject } from "@/lib/redis";
import type { ModelMessage } from "@/lib/llm";

export const runtime = "nodejs";
export const maxDuration = 120;

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

const SYSTEM_PROMPT = `You are a knowledge graph ontology expert. Analyze the documents and simulation requirement to design entity types and relationship types for a social media opinion simulation.

RULES:
- Output exactly 10 entity types. The last 2 MUST be "Person" (individual fallback) and "Organization" (org fallback).
- Output 6-10 edge types representing social media interactions.
- All entity types must be real-world actors that can post/interact on social media (no abstract concepts).
- Attribute names must NOT use: name, uuid, group_id, created_at, summary (reserved).
- Keep description fields under 100 characters.

Output valid JSON only. No markdown fences.`;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const simReq = formData.get("simulation_requirement") as string;
    const projectName = (formData.get("project_name") as string) || "Unnamed Project";
    const additionalContext = (formData.get("additional_context") as string) || "";
    const projectId = formData.get("project_id") as string | null;

    if (!simReq) {
      return NextResponse.json({ success: false, error: "simulation_requirement required" }, { status: 400 });
    }

    const fileEntries = formData.getAll("files") as File[];
    if (!fileEntries.length) {
      return NextResponse.json({ success: false, error: "At least one file required" }, { status: 400 });
    }

    // Get or create project
    let project = projectId ? await getProject(projectId) : null;
    if (!project) {
      project = await createProject(projectName, simReq);
    }

    // Extract text from all uploaded files
    const docTexts: string[] = [];
    let allText = "";

    for (const file of fileEntries) {
      if (!isAllowedFile(file.name)) continue;
      const buf = Buffer.from(await file.arrayBuffer());
      const raw = await extractText(buf, file.name);
      const clean = preprocessText(raw);
      docTexts.push(clean);
      allText += `\n\n=== ${file.name} ===\n${clean}`;

      project.files.push({ filename: file.name, size: file.size });
    }

    if (!docTexts.length) {
      return NextResponse.json({ success: false, error: "No processable files" }, { status: 400 });
    }

    project.total_text_length = allText.length;
    await saveProjectText(project.project_id, allText);

    // Truncate for LLM (50k chars)
    const MAX = 50000;
    const combined = docTexts.join("\n\n---\n\n").slice(0, MAX);

    const messages: ModelMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `## Simulation Requirement\n${simReq}\n\n## Documents\n${combined}${additionalContext ? `\n\n## Additional Context\n${additionalContext}` : ""}\n\nDesign the ontology for social media simulation.`,
      },
    ];

    const ontology = await llmJson(messages, OntologySchema, { temperature: 0.3 });

    // Enforce Person + Organization fallback types
    const names = new Set(ontology.entity_types.map((e) => e.name));
    if (!names.has("Person")) {
      ontology.entity_types.push({ name: "Person", description: "Any individual person.", attributes: [{ name: "full_name", type: "text", description: "Full name" }, { name: "role", type: "text", description: "Role" }], examples: ["ordinary citizen"] });
    }
    if (!names.has("Organization")) {
      ontology.entity_types.push({ name: "Organization", description: "Any organization.", attributes: [{ name: "org_name", type: "text", description: "Organization name" }], examples: ["community group"] });
    }
    // Cap at 10 each
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
        ontology: project.ontology,
        analysis_summary: project.analysis_summary,
        files: project.files,
        total_text_length: project.total_text_length,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
