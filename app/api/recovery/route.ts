import { NextResponse } from "next/server";
import { createRecoveryPoint, listRecoveryPoints, getRecoveryPoint } from "@/lib/recovery";

export async function GET() {
  const points = await listRecoveryPoints();
  return NextResponse.json(points);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { action, label, description } = body;

  if (action === "create") {
    const id = await createRecoveryPoint(label || "Manual backup", description);
    return NextResponse.json({ message: "Recovery point created", id });
  }

  if (action === "view" && body.id) {
    const point = await getRecoveryPoint(body.id);
    if (!point) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(point);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}