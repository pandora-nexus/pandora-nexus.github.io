import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const room = await prisma.chatRoom.update({
    where: { id },
    data: { name: body.name },
  });
  return NextResponse.json(room);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.chatRoom.update({
    where: { id },
    data: { isActive: false },
  });
  return NextResponse.json({ success: true });
}