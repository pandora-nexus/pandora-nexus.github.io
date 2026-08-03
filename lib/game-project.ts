import { prisma } from "@/lib/prisma";

export async function createGameProject(data: {
  title: string;
  description?: string;
  genre?: string;
  engine?: string;
  artStyle?: string;
  platform?: string;
}) {
  return prisma.gameProject.create({
    data: {
      title: data.title,
      description: data.description || "",
      genre: data.genre || "",
      engine: data.engine || "",
      artStyle: data.artStyle || "",
      platform: data.platform || "",
      status: "planning",
    },
  });
}