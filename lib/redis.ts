import { Redis } from "@upstash/redis";
import { randomUUID } from "crypto";
import type { Project, Task, Simulation, Report } from "./workflow-types";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// ─── Key helpers ─────────────────────────────────────────────────────────────

const K = {
  project: (id: string) => `project:${id}`,
  projectList: () => "projects",
  projectText: (id: string) => `project:${id}:text`,
  task: (id: string) => `task:${id}`,
  taskList: () => "tasks",
  simulation: (id: string) => `simulation:${id}`,
  report: (id: string) => `report:${id}`,
  simReport: (simId: string) => `sim_report:${simId}`,
};

// ─── Project ─────────────────────────────────────────────────────────────────

export async function createProject(name: string, simReq: string): Promise<Project> {
  const project: Project = {
    project_id: `proj_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
    name,
    status: "created",
    simulation_requirement: simReq,
    files: [],
    ontology: null,
    analysis_summary: "",
    total_text_length: 0,
    graph_id: null,
    graph_build_task_id: null,
    simulation_id: null,
    report_id: null,
    error: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  await redis.set(K.project(project.project_id), project);
  await redis.zadd(K.projectList(), { score: Date.now(), member: project.project_id });
  return project;
}

export async function getProject(id: string): Promise<Project | null> {
  return redis.get<Project>(K.project(id));
}

export async function saveProject(project: Project): Promise<void> {
  project.updated_at = new Date().toISOString();
  await redis.set(K.project(project.project_id), project);
}

export async function deleteProject(id: string): Promise<void> {
  await redis.del(K.project(id));
  await redis.del(K.projectText(id));
  await redis.zrem(K.projectList(), id);
}

export async function listProjects(limit = 50): Promise<Project[]> {
  const ids = await redis.zrange(K.projectList(), 0, limit - 1, { rev: true });
  if (!ids.length) return [];
  const projects = await Promise.all(ids.map((id) => redis.get<Project>(K.project(id as string))));
  return projects.filter(Boolean) as Project[];
}

export async function saveProjectText(id: string, text: string): Promise<void> {
  await redis.set(K.projectText(id), text);
}

export async function getProjectText(id: string): Promise<string | null> {
  return redis.get<string>(K.projectText(id));
}

// ─── Task ─────────────────────────────────────────────────────────────────────

export async function createTask(taskType: string): Promise<Task> {
  const task: Task = {
    task_id: `task_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
    task_type: taskType,
    status: "pending",
    message: "Task queued",
    progress: 0,
    result: null,
    error: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  await redis.set(K.task(task.task_id), task);
  await redis.zadd(K.taskList(), { score: Date.now(), member: task.task_id });
  return task;
}

export async function getTask(id: string): Promise<Task | null> {
  return redis.get<Task>(K.task(id));
}

export async function updateTask(
  id: string,
  patch: Partial<Pick<Task, "status" | "message" | "progress" | "result" | "error">>
): Promise<void> {
  const task = await getTask(id);
  if (!task) return;
  Object.assign(task, patch, { updated_at: new Date().toISOString() });
  await redis.set(K.task(id), task);
}

// ─── Simulation ───────────────────────────────────────────────────────────────

export async function saveSimulation(sim: Simulation): Promise<void> {
  await redis.set(K.simulation(sim.simulation_id), sim);
}

export async function getSimulation(id: string): Promise<Simulation | null> {
  return redis.get<Simulation>(K.simulation(id));
}

// ─── Report ───────────────────────────────────────────────────────────────────

export async function saveReport(report: Report): Promise<void> {
  await redis.set(K.report(report.report_id), report);
  await redis.set(K.simReport(report.simulation_id), report.report_id);
}

export async function getReport(id: string): Promise<Report | null> {
  return redis.get<Report>(K.report(id));
}

export async function getReportBySimulation(simId: string): Promise<Report | null> {
  const reportId = await redis.get<string>(K.simReport(simId));
  if (!reportId) return null;
  return getReport(reportId);
}
