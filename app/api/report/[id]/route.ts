import { NextResponse } from "next/server";
import { getReport, getReportBySimulation } from "@/lib/redis";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Support lookup by simulation_id too
  const report = id.startsWith("sim_")
    ? await getReportBySimulation(id)
    : await getReport(id);
  if (!report) {
    return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: report });
}
