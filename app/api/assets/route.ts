import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const projectId = searchParams.get("projectId");
  const isFree = searchParams.get("isFree");

  const assets = await prisma.asset.findMany({
    where: {
      type: type || undefined,
      projectId: projectId || undefined,
      isFree: isFree !== null ? isFree === "true" : undefined,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(assets);
}

export async function POST(request: Request) {
  const body = await request.json();
  const asset = await prisma.asset.create({ data: body });
  return NextResponse.json(asset);
}