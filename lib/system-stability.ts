import { prisma } from "@/lib/prisma";

interface StabilityReport {
  database: { status: string; tables: number };
  backups: { count: number; lastBackup: string | null };
  logs: { totalErrors: number; recentErrors: number };
  uptime: { hours: number; status: string };
  recommendations: string[];
}

export async function runStabilityCheck(): Promise<StabilityReport> {
  const recommendations: string[] = [];

  // 1. Veritabanı sağlık kontrolü
  let dbStatus = "healthy";
  let tableCount = 0;
  try {
    const result = await prisma.$queryRawUnsafe<Array<{ count: number }>>(
      `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'`
    );
    tableCount = result[0]?.count || 0;
  } catch {
    dbStatus = "error";
    recommendations.push("Veritabanı bağlantısı kontrol edilmeli.");
  }

  // 2. Kurtarma noktası kontrolü
  const recoveryPoints = await prisma.recoveryPoint.count();
  const lastRecovery = await prisma.recoveryPoint.findFirst({
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  if (recoveryPoints === 0) {
    recommendations.push("Hiç kurtarma noktası yok. Hemen bir tane oluşturun.");
  } else if (lastRecovery) {
    const hoursSinceLastBackup =
      (Date.now() - new Date(lastRecovery.createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastBackup > 24) {
      recommendations.push(`Son yedek ${Math.round(hoursSinceLastBackup)} saat önce alınmış. Yeni yedek alın.`);
    }
  }

  // 3. Hata log'larını kontrol et
  const recentErrors = await prisma.auditLog.count({
    where: {
      severity: { in: ["ERROR", "CRITICAL"] },
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });

  if (recentErrors > 10) {
    recommendations.push(`Son 24 saatte ${recentErrors} hata oluştu. İncelenmeli.`);
  }

  // 4. Otomatik kurtarma noktası oluştur
  if (recoveryPoints === 0 || (lastRecovery && 
    (Date.now() - new Date(lastRecovery.createdAt).getTime()) > 12 * 60 * 60 * 1000)) {
    await prisma.recoveryPoint.create({
      data: {
        label: `Otomatik stabilite yedeği - ${new Date().toISOString()}`,
        description: "Sistem stabilite kontrolü tarafından otomatik oluşturuldu.",
        snapshot: JSON.stringify({ timestamp: new Date().toISOString() }),
      },
    });
    recommendations.push("Otomatik kurtarma noktası oluşturuldu.");
  }

  return {
    database: {
      status: dbStatus,
      tables: tableCount,
    },
    backups: {
      count: recoveryPoints + 1,
      lastBackup: new Date().toISOString(),
    },
    logs: {
      totalErrors: await prisma.auditLog.count({ where: { severity: "ERROR" } }),
      recentErrors,
    },
    uptime: {
      hours: Math.round(process.uptime() / 3600),
      status: process.uptime() > 3600 ? "stable" : "recently_started",
    },
    recommendations,
  };
}