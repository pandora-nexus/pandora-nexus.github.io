import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Tek bir oyun projesini getir
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await prisma.gameProject.findUnique({
    where: { id },
    include: {
      assets: true,
    },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  return NextResponse.json(project);
}

// Oyun projesini sil
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.gameProject.delete({ where: { id } });
  return NextResponse.json({ success: true });
}