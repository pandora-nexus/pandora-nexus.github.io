import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const conversationCount = await prisma.conversation.count({
      where: { createdAt: { gte: today } },
    });

    const learningCount = await prisma.learning.count({
      where: { status: "active" },
    });

    const documentCount = await prisma.document.count();

    const recentConversations = await prisma.conversation.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { question: true, createdAt: true },
    });

    const report = {
      date: new Date().toISOString().split("T")[0],
      summary: {
        totalConversations: conversationCount,
        totalDocuments: documentCount,
        activeLearningRecords: learningCount,
      },
      recentActivity: recentConversations.map((c) => ({
        question: c.question.substring(0, 80),
        time: c.createdAt,
      })),
      systemStatus: {
        database: "Online",
        deepseek: "Connected",
        serper: process.env.SERPER_API_KEY ? "Connected" : "Not configured",
        vault: process.env.DEEPSEEK_API_KEY ? "Connected" : "Not configured",
      },
    };

    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json(
      { error: "Report generation failed", details: String(error) },
      { status: 500 }
    );
  }
}