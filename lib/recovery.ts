import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

interface SystemSnapshot {
  documentCount: number;
  conversationCount: number;
  learningCount: number;
  permissionCount: number;
  auditLogCount: number;
  aiRegistryCount: number;
  toolRegistryCount: number;
  gameProjectCount: number;
  knowledgeEvolutionCount: number;
  recoveryPointCount: number;
  timestamp: string;
}

export async function createRecoveryPoint(label: string, description?: string): Promise<string> {
  const snapshot: SystemSnapshot = {
    documentCount: await prisma.document.count(),
    conversationCount: await prisma.conversation.count(),
    learningCount: await prisma.learning.count(),
    permissionCount: await prisma.permission.count(),
    auditLogCount: await prisma.auditLog.count(),
    aiRegistryCount: await prisma.aIRegistry.count(),
    toolRegistryCount: await prisma.toolRegistry.count(),
    gameProjectCount: await prisma.gameProject.count(),
    knowledgeEvolutionCount: await prisma.knowledgeEvolution.count(),
    recoveryPointCount: await prisma.recoveryPoint.count(),
    timestamp: new Date().toISOString(),
  };

  const point = await prisma.recoveryPoint.create({
    data: {
      label,
      description: description || "",
      snapshot: JSON.stringify(snapshot),
    },
  });

  const backupDir = path.join(process.cwd(), "data", "recovery");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(backupDir, `${point.id}.json`),
    JSON.stringify(snapshot, null, 2)
  );

  return point.id;
}

export async function listRecoveryPoints() {
  return prisma.recoveryPoint.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, label: true, description: true, createdAt: true },
  });
}

export async function getRecoveryPoint(id: string) {
  return prisma.recoveryPoint.findUnique({ where: { id } });
}