import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rooms = await prisma.chatRoom.findMany({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: { content: true, createdAt: true },
      },
    },
  });
  return NextResponse.json(rooms);
}

export async function POST(request: Request) {
  const body = await request.json();
  const room = await prisma.chatRoom.create({
    data: {
      name: body.name || "Yeni Sohbet",
      type: body.type || "general",
      projectId: body.projectId || null,
    },
  });
  return NextResponse.json(room);
}