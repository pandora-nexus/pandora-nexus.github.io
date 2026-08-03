import { NextResponse } from "next/server";
import { buildSkill, listSkills } from "@/lib/skill-builder";

export async function GET() {
  const skills = await listSkills();
  return NextResponse.json(skills);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { skillName } = body;

  if (!skillName) {
    return NextResponse.json({ error: "Skill name is required" }, { status: 400 });
  }

  try {
    const result = await buildSkill(skillName);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Skill building failed", details: String(error) },
      { status: 500 }
    );
  }
}