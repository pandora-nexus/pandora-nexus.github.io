import { NextResponse } from "next/server";
import { createGodotProject, getGodotVersion } from "@/lib/godot-integration";

export async function GET() {
  const version = await getGodotVersion();
  return NextResponse.json({ engine: "Godot", version, status: "ready" });
}

export async function POST(request: Request) {
  const body = await request.json();
  
  if (body.action === "create-project") {
    const result = await createGodotProject(
      body.projectName || "NewGame",
      body.projectPath || "C:/PANDORA_Projects/Games"
    );
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}