import { NextResponse } from "next/server";
import { runBackgroundResearch } from "@/lib/background-research";

export async function POST() {
  try {
    await runBackgroundResearch();
    return NextResponse.json({ message: "Background research completed" });
  } catch (error) {
    return NextResponse.json(
      { error: "Research failed", details: String(error) },
      { status: 500 }
    );
  }
}