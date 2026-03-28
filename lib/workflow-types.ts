// ─── Shared types ────────────────────────────────────────────────────────────

export type ProjectStatus =
  | "created"
  | "ontology_generated"
  | "graph_building"
  | "graph_completed"
  | "simulation_running"
  | "simulation_completed"
  | "failed";

export type TaskStatus = "pending" | "processing" | "completed" | "failed";

export interface OntologyAttribute {
  name: string;
  type: string;
  description: string;
}

export interface EntityType {
  name: string;
  description: string;
  attributes: OntologyAttribute[];
  examples: string[];
}

export interface EdgeType {
  name: string;
  description: string;
  source_targets: { source: string; target: string }[];
  attributes: OntologyAttribute[];
}

export interface Ontology {
  entity_types: EntityType[];
  edge_types: EdgeType[];
}

export interface ProjectFile {
  filename: string;
  size: number;
  blobUrl?: string;
}

export interface Project {
  project_id: string;
  name: string;
  status: ProjectStatus;
  simulation_requirement: string;
  files: ProjectFile[];
  ontology: Ontology | null;
  analysis_summary: string;
  total_text_length: number;
  graph_id: string | null;
  graph_build_task_id: string | null;
  simulation_id: string | null;
  report_id: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  task_id: string;
  task_type: string;
  status: TaskStatus;
  message: string;
  progress: number;
  result: Record<string, unknown> | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface SimulationAgent {
  agent_id: string;
  entity_type: string;
  name: string;
  description: string;
  posts: SimulationPost[];
}

export interface SimulationPost {
  agent_id: string;
  agent_name: string;
  entity_type: string;
  platform: string;
  content: string;
  sentiment: "bullish" | "bearish" | "neutral";
  timestamp: string;
  likes: number;
  shares: number;
}

export interface SimulationSummary {
  total_posts: number;
  bullish_count: number;
  bearish_count: number;
  neutral_count: number;
  key_themes: string[];
  sentiment_score: number; // -1 to 1
}

export interface Simulation {
  simulation_id: string;
  project_id: string;
  graph_id: string;
  status: TaskStatus;
  agents: SimulationAgent[];
  posts: SimulationPost[];
  summary: SimulationSummary | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface Report {
  report_id: string;
  simulation_id: string;
  project_id: string;
  status: "generating" | "completed" | "failed";
  markdown_content: string;
  outline: string[];
  error: string | null;
  created_at: string;
  completed_at: string | null;
}
