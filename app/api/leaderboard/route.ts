import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Her kullanıcının en yüksek skorunu al
  const leaderboard = await prisma.$queryRawUnsafe<
    Array<{ username: string; highScore: number; totalGames: number }>
  >(
    `SELECT 
      username, 
      MAX(score) as "highScore", 
      COUNT(*)::int as "totalGames"
    FROM "GameScore"
    GROUP BY username
    ORDER BY "highScore" DESC
    LIMIT 20`
  );

  return NextResponse.json(leaderboard);
}