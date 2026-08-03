import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const decisions = await prisma.decisionRecord.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json(decisions);
}

export async function POST(request: Request) {
  const body = await request.json();
  const decision = await prisma.decisionRecord.create({ data: body });
  return NextResponse.json(decision);
}