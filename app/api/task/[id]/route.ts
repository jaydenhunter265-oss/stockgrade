import { NextResponse } from "next/server";
import { getTask } from "@/lib/redis";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await getTask(id);
  if (!task) {
    return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: task });
}
