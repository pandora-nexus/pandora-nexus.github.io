import { NextResponse } from "next/server";

const rooms = new Map<string, { id: string; name: string; players: string[]; maxPlayers: number }>();

export async function GET() {
  return NextResponse.json(Array.from(rooms.values()));
}

export async function POST(request: Request) {
  const body = await request.json();
  const action = body.action;

  if (action === "create") {
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

  if (action === "join") {
    const room = rooms.get(body.roomId);
    if (!room) return NextResponse.json({ error: "Oda bulunamadı" }, { status: 404 });
    if (room.players.length >= room.maxPlayers) return NextResponse.json({ error: "Oda dolu" }, { status: 400 });
    if (!room.players.includes(body.username)) {
      room.players.push(body.username);
    }
    return NextResponse.json(room);
  }

  if (action === "leave") {
    const room = rooms.get(body.roomId);
    if (!room) return NextResponse.json({ error: "Oda bulunamadı" }, { status: 404 });
    room.players = room.players.filter(p => p !== body.username);
    return NextResponse.json(room);
  }

  if (action === "status") {
    const room = rooms.get(body.roomId);
    if (!room) return NextResponse.json({ error: "Oda bulunamadı" }, { status: 404 });
    return NextResponse.json(room);
  }

  return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
}