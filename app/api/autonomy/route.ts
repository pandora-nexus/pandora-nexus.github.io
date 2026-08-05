import { NextResponse } from "next/server";
import { shouldAutoApprove, getAutonomyReport } from "@/lib/autonomous-decisions";

export async function GET() {
  const report = await getAutonomyReport();
  return NextResponse.json(report);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { action } = body;

  if (!action) {
    return NextResponse.json({ error: "Action is required" }, { status: 400 });
  }

  const decision = await shouldAutoApprove(action);
  return NextResponse.json(decision);
}