import { NextResponse } from "next/server";
import { getProject, saveProject, getProjectText, createTask, updateTask } from "@/lib/redis";
import { createGraph, setGraphOntology, addTextBatches, waitForEpisodes, getGraphData } from "@/lib/zep";
import { splitText } from "@/lib/pdf";
import type { Ontology } from "@/lib/workflow-types";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { project_id, graph_name, chunk_size = 500, chunk_overlap = 50 } = body;

    if (!project_id) {
      return NextResponse.json({ success: false, error: "project_id required" }, { status: 400 });
    }

    const project = await getProject(project_id);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }
    if (project.status === "created") {
      return NextResponse.json({ success: false, error: "Generate ontology first" }, { status: 400 });
    }

    const text = await getProjectText(project_id);
    if (!text) {
      return NextResponse.json({ success: false, error: "No extracted text found" }, { status: 400 });
    }

    const task = await createTask("graph_build");
    project.status = "graph_building";
    project.graph_build_task_id = task.task_id;
    await saveProject(project);

    // Run graph build asynchronously (Vercel background via after())
    buildGraphBackground({
      projectId: project_id,
      taskId: task.task_id,
      graphName: graph_name || project.name,
      ontology: project.ontology!,
      text,
      chunkSize: chunk_size,
      chunkOverlap: chunk_overlap,
    });

    return NextResponse.json({
      success: true,
      data: { project_id, task_id: task.task_id, message: "Graph build started" },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

async function buildGraphBackground({
  projectId, taskId, graphName, ontology, text, chunkSize, chunkOverlap,
}: {
  projectId: string;
  taskId: string;
  graphName: string;
  ontology: Ontology;
  text: string;
  chunkSize: number;
  chunkOverlap: number;
}) {
  try {
    await updateTask(taskId, { status: "processing", message: "Creating Zep graph…", progress: 5 });

    const graphId = await createGraph(graphName);

    // Save graph ID to project immediately
    const project = await getProject(projectId);
    if (project) { project.graph_id = graphId; await saveProject(project); }

    await updateTask(taskId, { message: "Setting ontology…", progress: 10 });
    await setGraphOntology(graphId, ontology);

    const chunks = splitText(text, chunkSize, chunkOverlap);
    await updateTask(taskId, { message: `Adding ${chunks.length} text chunks…`, progress: 15 });

    const episodeUuids = await addTextBatches(graphId, chunks, 3, (done, total) => {
      const pct = 15 + Math.round((done / total) * 40);
      updateTask(taskId, { progress: pct, message: `Uploading chunks ${done}/${total}…` });
    });

    await updateTask(taskId, { message: "Waiting for Zep to process episodes…", progress: 55 });
    await waitForEpisodes(graphId, episodeUuids, (done, total) => {
      const pct = 55 + Math.round((done / total) * 35);
      updateTask(taskId, { progress: pct, message: `Processing episodes ${done}/${total}…` });
    });

    await updateTask(taskId, { message: "Fetching graph summary…", progress: 95 });
    const graphData = await getGraphData(graphId);

    const proj = await getProject(projectId);
    if (proj) { proj.status = "graph_completed"; proj.graph_id = graphId; await saveProject(proj); }

    await updateTask(taskId, {
      status: "completed",
      message: "Graph build complete",
      progress: 100,
      result: { graph_id: graphId, node_count: graphData.node_count, edge_count: graphData.edge_count },
    });
  } catch (err) {
    const proj = await getProject(projectId);
    if (proj) { proj.status = "failed"; proj.error = String(err); await saveProject(proj); }
    await updateTask(taskId, { status: "failed", message: String(err), error: String(err) });
  }
}
