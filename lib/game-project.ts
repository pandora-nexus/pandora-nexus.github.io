import { prisma } from "@/lib/prisma";

interface GameProjectInput {
  title: string;
  description?: string;
  genre?: string;
  engine?: string;
  artStyle?: string;
  platform?: string;
}

export async function createGameProject(input: GameProjectInput) {
  return prisma.gameProject.create({
    data: {
      title: input.title || "Yeni Oyun",
      description: input.description || "",
      genre: input.genre || "Belirtilmedi",
      engine: input.engine || "Belirtilmedi",
      artStyle: input.artStyle || "Belirtilmedi",
      platform: input.platform || "PC",
      status: "planning",
    },
  });
}

export async function listGameProjects() {
  return prisma.gameProject.findMany({
    orderBy: { updatedAt: "desc" },
    include: { assets: true },
  });
}