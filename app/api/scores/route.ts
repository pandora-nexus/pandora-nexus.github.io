import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Skor kaydet
export async function POST(request: Request) {
  const body = await request.json();
  const { username, roomId, score, metadata } = body;

  if (!username || !roomId || score === undefined) {
    return NextResponse.json({ error: "Eksik bilgi" }, { status: 400 });
  }

  const gameScore = await prisma.gameScore.create({
    data: { username, roomId, score, metadata: metadata || null },
  });

  return NextResponse.json(gameScore);
}

// Skorları getir
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");
  const username = searchParams.get("username");
  const limit = parseInt(searchParams.get("limit") || "10");

  const where: any = {};
  if (roomId) where.roomId = roomId;
  if (username) where.username = username;

  const scores = await prisma.gameScore.findMany({
    where,
    orderBy: { score: "desc" },
    take: limit,
  });

  return NextResponse.json(scores);
}