import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const ais = await prisma.aIRegistry.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(ais);
}

export async function POST(request: Request) {
  const body = await request.json();
  const ai = await prisma.aIRegistry.create({ data: body });
  return NextResponse.json(ai);
}