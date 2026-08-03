import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const tools = await prisma.toolRegistry.findMany({
    where: category ? { category } : {},
    orderBy: { toolName: "asc" },
  });
  return NextResponse.json(tools);
}

export async function POST(request: Request) {
  const body = await request.json();
  const tool = await prisma.toolRegistry.create({ data: body });
  return NextResponse.json(tool);
}