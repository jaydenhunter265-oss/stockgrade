/**
 * Zep Cloud REST API wrapper
 * Docs: https://help.getzep.com/
 */

const ZEP_BASE = (process.env.ZEP_BASE_URL || "https://api.getzep.com").replace(/\/$/, "");

async function zepFetch<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${ZEP_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Api-Key ${process.env.ZEP_API_KEY}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Zep API error ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// ─── Graphs ───────────────────────────────────────────────────────────────────

export interface ZepOntologyAttribute {
  name: string;
  type: string;
  description: string;
}

export interface ZepEntityType {
  name: string;
  description: string;
  attributes: ZepOntologyAttribute[];
}

export interface ZepEdgeType {
  name: string;
  description: string;
  source_targets: { source: string; target: string }[];
  attributes: ZepOntologyAttribute[];
}

export interface ZepOntology {
  entity_types: ZepEntityType[];
  edge_types: ZepEdgeType[];
}

export async function createGraph(name: string): Promise<string> {
  const res = await zepFetch<{ uuid: string }>("/api/v2/graphs", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return res.uuid;
}

export async function deleteGraph(graphId: string): Promise<void> {
  await zepFetch(`/api/v2/graphs/${graphId}`, { method: "DELETE" });
}

export async function setGraphOntology(graphId: string, ontology: ZepOntology): Promise<void> {
  await zepFetch(`/api/v2/graphs/${graphId}/ontology`, {
    method: "POST",
    body: JSON.stringify(ontology),
  });
}

export async function addEpisode(
  graphId: string,
  content: string,
  referenceTime?: string
): Promise<string> {
  const res = await zepFetch<{ uuid: string }>(`/api/v2/graphs/${graphId}/episodes`, {
    method: "POST",
    body: JSON.stringify({
      type: "text",
      content,
      reference_time: referenceTime ?? new Date().toISOString(),
    }),
  });
  return res.uuid;
}

export async function getEpisodeStatus(
  graphId: string,
  episodeUuid: string
): Promise<string> {
  const res = await zepFetch<{ status: string }>(
    `/api/v2/graphs/${graphId}/episodes/${episodeUuid}`
  );
  return res.status;
}

export interface ZepNode {
  uuid: string;
  name: string;
  entity_type: string;
  summary?: string;
  attributes?: Record<string, string>;
}

export interface ZepEdge {
  uuid: string;
  source_node_uuid: string;
  target_node_uuid: string;
  relation_type: string;
  fact?: string;
}

export interface GraphData {
  nodes: ZepNode[];
  edges: ZepEdge[];
  node_count: number;
  edge_count: number;
}

export async function getGraphData(graphId: string): Promise<GraphData> {
  const [nodesRes, edgesRes] = await Promise.all([
    zepFetch<{ nodes: ZepNode[] }>(`/api/v2/graphs/${graphId}/nodes`),
    zepFetch<{ edges: ZepEdge[] }>(`/api/v2/graphs/${graphId}/edges`),
  ]);
  const nodes = nodesRes.nodes ?? [];
  const edges = edgesRes.edges ?? [];
  return { nodes, edges, node_count: nodes.length, edge_count: edges.length };
}

export async function searchGraph(
  graphId: string,
  query: string,
  limit = 10
): Promise<{ facts: string[]; nodes: ZepNode[] }> {
  const res = await zepFetch<{ edges: ZepEdge[]; nodes: ZepNode[] }>(
    `/api/v2/graphs/${graphId}/search`,
    {
      method: "POST",
      body: JSON.stringify({ query, limit }),
    }
  );
  const facts = (res.edges ?? []).map((e) => e.fact ?? "").filter(Boolean);
  return { facts, nodes: res.nodes ?? [] };
}

// ─── Batch text ingestion ─────────────────────────────────────────────────────

export async function addTextBatches(
  graphId: string,
  chunks: string[],
  batchSize = 3,
  onProgress?: (done: number, total: number) => void
): Promise<string[]> {
  const uuids: string[] = [];
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const ids = await Promise.all(batch.map((c) => addEpisode(graphId, c)));
    uuids.push(...ids);
    onProgress?.(Math.min(i + batchSize, chunks.length), chunks.length);
    // Small delay to avoid rate limiting
    if (i + batchSize < chunks.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  return uuids;
}

/** Poll until all episodes are processed (or timeout) */
export async function waitForEpisodes(
  graphId: string,
  episodeUuids: string[],
  onProgress?: (done: number, total: number) => void,
  timeoutMs = 300_000
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  const pending = new Set(episodeUuids);
  while (pending.size > 0 && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 3000));
    const toCheck = [...pending].slice(0, 5);
    for (const uuid of toCheck) {
      try {
        const status = await getEpisodeStatus(graphId, uuid);
        if (status === "processed" || status === "complete") {
          pending.delete(uuid);
        }
      } catch {
        // ignore transient errors
      }
    }
    onProgress?.(episodeUuids.length - pending.size, episodeUuids.length);
  }
}
