import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ documents: [], query: "" });
  }

  try {
    const documents = await prisma.$queryRawUnsafe<
      Array<{ id: string; title: string; slug: string; type: string; rank: number }>
    >(
      `SELECT id, title, slug, type, ts_rank(search_vector, plainto_tsquery('english', $1)) as rank
       FROM "Document"
       WHERE search_vector @@ plainto_tsquery('english', $1)
       ORDER BY rank DESC
       LIMIT 10`,
      query
    );

    return NextResponse.json({ documents, query });
  } catch (error) {
    return NextResponse.json(
      { error: "Search failed", details: String(error) },
      { status: 500 }
    );
  }
}