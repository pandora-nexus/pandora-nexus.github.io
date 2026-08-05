import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ProjectSummary {
  id: string;
  name: string;
  type: string;
  status: string;
  priority: number;
  messageCount: number;
  lastActivity: string | null;
  tokenUsage: number;
}

export async function GET() {
  // Tüm projeleri topla (GameProject + ChatRoom)
  const [gameProjects, chatRooms] = await Promise.all([
    prisma.gameProject.findMany({
      orderBy: { updatedAt: "desc" },
    }),
    prisma.chatRoom.findMany({
      where: { type: "project", isActive: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const projects: ProjectSummary[] = [];

  // Oyun projeleri
  for (const gp of gameProjects) {
    const msgCount = await prisma.message.count({
      where: { room: { projectId: gp.id } },
    });
    projects.push({
      id: gp.id,
      name: gp.title,
      type: "game",
      status: gp.status,
      priority: gp.status === "active" ? 1 : 2,
      messageCount: msgCount,
      lastActivity: gp.updatedAt?.toISOString() || null,
      tokenUsage: msgCount * 500, // Tahmini token
    });
  }

  // Proje odaları
  for (const room of chatRooms) {
    const msgCount = await prisma.message.count({
      where: { roomId: room.id },
    });
    projects.push({
      id: room.id,
      name: room.name,
      type: "chat",
      status: room.isActive ? "active" : "archived",
      priority: 2,
      messageCount: msgCount,
      lastActivity: room.updatedAt?.toISOString() || null,
      tokenUsage: msgCount * 500,
    });
  }

  // Önceliğe göre sırala
  projects.sort((a, b) => a.priority - b.priority);

  return NextResponse.json({
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === "active").length,
    totalTokenEstimate: projects.reduce((sum, p) => sum + p.tokenUsage, 0),
    projects,
  });
}