import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Oyun projelerini listele
export async function GET() {
  const projects = await prisma.gameProject.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      assets: true,
    },
  });
  return NextResponse.json(projects);
}

// Yeni oyun projesi oluştur
export async function POST(request: Request) {
  const body = await request.json();
  const project = await prisma.gameProject.create({ data: body });
  return NextResponse.json(project);
}

// Oyun projesini güncelle
export async function PUT(request: Request) {
  const body = await request.json();
  const { id, ...data } = body;
  const project = await prisma.gameProject.update({
    where: { id },
    data,
  });
  return NextResponse.json(project);
}