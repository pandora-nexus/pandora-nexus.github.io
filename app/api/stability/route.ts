import { NextResponse } from "next/server";
import { runStabilityCheck } from "@/lib/system-stability";

export async function GET() {
  const report = await runStabilityCheck();
  return NextResponse.json(report);
}