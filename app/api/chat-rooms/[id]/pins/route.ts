import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const pins = await prisma.message.findMany({
    where: { roomId: id, role: "pin" },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(pins);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const pin = await prisma.message.create({
    data: {
      roomId: id,
      role: "pin",
      content: body.content,
    },
  });
  return NextResponse.json(pin);
}