import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Son 50 bildirimi topla (Learning + AuditLog + CrossDepartmentInsight)
  const [learnings, audits, insights, scores] = await Promise.all([
    prisma.learning.findMany({
      where: { status: "active" },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { title: true, description: true, category: true, createdAt: true },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { action: true, severity: true, createdAt: true },
    }),
    prisma.crossDepartmentInsight.findMany({
      where: { status: "proposed" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { title: true, sourceDept: true, targetDept: true, createdAt: true },
    }),
    prisma.gameScore.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { username: true, score: true, createdAt: true },
    }),
  ]);

  const notifications: any[] = [];

  // Learning kayıtlarını bildirime çevir
  learnings.forEach(l => {
    notifications.push({
      type: "learning",
      icon: l.category === "correction" ? "🔧" : l.category === "research" ? "🔍" : "📚",
      title: l.title,
      detail: l.description?.substring(0, 100),
      time: l.createdAt,
    });
  });

  // Audit log'ları bildirime çevir
  audits.forEach(a => {
    if (a.severity === "ERROR" || a.severity === "CRITICAL" || a.severity === "WARNING") {
      notifications.push({
        type: "security",
        icon: a.severity === "CRITICAL" ? "⛔" : a.severity === "ERROR" ? "❌" : "⚠️",
        title: a.action,
        detail: `Seviye: ${a.severity}`,
        time: a.createdAt,
      });
    }
  });

  // Departman içgörülerini bildirime çevir
  insights.forEach(i => {
    notifications.push({
      type: "insight",
      icon: "💡",
      title: `${i.sourceDept} → ${i.targetDept}`,
      detail: i.title,
      time: i.createdAt,
    });
  });

  // Skorları bildirime çevir
  scores.forEach(s => {
    notifications.push({
      type: "score",
      icon: "🏆",
      title: `${s.username} yeni skor!`,
      detail: `${s.score.toLocaleString()} puan`,
      time: s.createdAt,
    });
  });

  // Zamana göre sırala (en yeni en üstte)
  notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return NextResponse.json(notifications.slice(0, 50));
}