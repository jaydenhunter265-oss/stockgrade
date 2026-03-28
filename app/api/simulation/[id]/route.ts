import { NextResponse } from "next/server";
import { getSimulation } from "@/lib/redis";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sim = await getSimulation(id);
  if (!sim) {
    return NextResponse.json({ success: false, error: "Simulation not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: sim });
}
