import { NextResponse } from "next/server";
import { generateStrategicAnalysis } from "@/lib/strategy-engine";

export async function GET() {
  try {
    const analysis = await generateStrategicAnalysis();
    return NextResponse.json(analysis);
  } catch (error) {
    return NextResponse.json(
      { error: "Strategic analysis failed", details: String(error) },
      { status: 500 }
    );
  }
}