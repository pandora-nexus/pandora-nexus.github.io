import { NextResponse } from "next/server";
import { scanForCrossDepartmentInsights, getPendingInsights } from "@/lib/cross-dept-intelligence";

export async function GET() {
  const insights = await getPendingInsights();
  return NextResponse.json(insights);
}

export async function POST() {
  const count = await scanForCrossDepartmentInsights();
  return NextResponse.json({ message: "Cross-department scan completed", insightsCreated: count });
}