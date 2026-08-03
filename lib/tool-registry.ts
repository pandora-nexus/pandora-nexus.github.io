import { prisma } from "@/lib/prisma";

export async function getTool(name: string) {
  return prisma.toolRegistry.findUnique({ where: { toolName: name } });
}

export async function getAllTools(category?: string) {
  return prisma.toolRegistry.findMany({
    where: category ? { category } : {},
    orderBy: { toolName: "asc" },
  });
}

export async function updateToolHealth(name: string, status: string) {
  return prisma.toolRegistry.update({
    where: { toolName: name },
    data: { healthStatus: status },
  });
}