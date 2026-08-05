import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; pinId: string }> }
) {
  const { pinId } = await params;
  await prisma.message.delete({ where: { id: pinId } });
  return NextResponse.json({ success: true });
}