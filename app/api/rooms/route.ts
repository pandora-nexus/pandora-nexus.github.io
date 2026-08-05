import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const rooms: Map<string, { id: string; name: string; players: string[]; maxPlayers: number }> = new Map();

export async function GET() {
  return NextResponse.json(Array.from(rooms.values()));
}

export async function POST(request: Request) {
  const body = await request.json();
  const id = Math.random().toString(36).substring(2, 8).toUpperCase();
  const room = {
    id,
    name: body.name || `Oda ${id}`,
    players: [],
    maxPlayers: body.maxPlayers || 4,
  };
  rooms.set(id, room);
  return NextResponse.json(room);
}