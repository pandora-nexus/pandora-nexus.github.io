import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const documents = await prisma.document.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        updatedAt: true,
      },
      orderBy: { title: "asc" },
    });
    return NextResponse.json(documents);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch documents", details: String(error) },
      { status: 500 }
    );
  }
}