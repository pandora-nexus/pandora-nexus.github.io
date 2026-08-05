import { NextResponse } from "next/server";
import { scanSourceCode } from "@/lib/code-self-analyzer";

export async function GET() {
  try {
    const result = await scanSourceCode();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Code analysis failed", details: String(error) },
      { status: 500 }
    );
  }
}