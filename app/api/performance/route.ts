import { NextResponse } from 'next/server';
import { readPerformanceData } from '@/lib/performance.server';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

export async function GET() {
  const data = await readPerformanceData();
  return NextResponse.json(data);
}
