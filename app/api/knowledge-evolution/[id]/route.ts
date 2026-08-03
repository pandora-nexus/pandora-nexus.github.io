import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Tek bir evrim kaydını getir
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const record = await prisma.knowledgeEvolution.findUnique({
    where: { id },
    include: { document: true },
  });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(record);
}

// Evrim önerisini onayla veya reddet
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { action } = body; // "approve" veya "reject"

  if (action === "approve") {
    const record = await prisma.knowledgeEvolution.findUnique({ where: { id } });
    if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Belgeyi güncelle
    if (record.documentId) {
      await prisma.document.update({
        where: { id: record.documentId },
        data: { content: record.newContent },
      });
    }

    // Evrim kaydını güncelle
    const updated = await prisma.knowledgeEvolution.update({
      where: { id },
      data: {
        status: "approved",
        approvedAt: new Date(),
        approvedBy: "Patron",
      },
    });

    return NextResponse.json({ message: "Knowledge updated successfully", record: updated });
  }

  if (action === "reject") {
    const updated = await prisma.knowledgeEvolution.update({
      where: { id },
      data: {
        status: "rejected",
        approvedAt: new Date(),
        approvedBy: "Patron",
      },
    });
    return NextResponse.json({ message: "Update rejected", record: updated });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}