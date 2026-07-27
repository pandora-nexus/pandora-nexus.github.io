import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const pending = await prisma.permission.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return NextResponse.json(pending);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { action, permissionId, approve } = body;

  if (permissionId && approve) {
    await prisma.permission.update({
      where: { id: permissionId },
      data: { status: "approved", approvedBy: "Patron", resolvedAt: new Date() },
    });
    return NextResponse.json({ status: "APPROVED", permissionId });
  }

  if (permissionId && approve === false) {
    await prisma.permission.update({
      where: { id: permissionId },
      data: { status: "denied", approvedBy: "Patron", resolvedAt: new Date() },
    });
    return NextResponse.json({ status: "DENIED", permissionId });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}