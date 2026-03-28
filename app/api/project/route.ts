import { NextResponse } from "next/server";
import { createProject, listProjects } from "@/lib/redis";

export const runtime = "nodejs";

export async function GET() {
  const projects = await listProjects(50);
  return NextResponse.json({ success: true, data: projects });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name = "Unnamed Project", simulation_requirement } = body;
  if (!simulation_requirement) {
    return NextResponse.json({ success: false, error: "simulation_requirement required" }, { status: 400 });
  }
  const project = await createProject(name, simulation_requirement);
  return NextResponse.json({ success: true, data: project });
}
