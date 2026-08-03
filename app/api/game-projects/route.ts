import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const projects = await prisma.gameProject.findMany({
    orderBy: { createdAt: "desc" },
    include: { assets: true },
  });
  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  const body = await request.json();
  const project = await prisma.gameProject.create({ data: body });
  return NextResponse.json(project);
}