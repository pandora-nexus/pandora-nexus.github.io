import { prisma } from "@/lib/prisma";

interface Decision {
  action: string;
  riskLevel: string;
  autoApproved: boolean;
  reason: string;
}

// Daha önce onaylanmış benzer işlemleri kontrol et
export async function shouldAutoApprove(action: string): Promise<Decision> {
  // Aynı veya benzer işlem daha önce onaylanmış mı?
  const similarApproved = await prisma.permission.count({
    where: {
      action: { contains: extractKeywords(action) },
      status: "approved",
    },
  });

  // Risk seviyesini belirle
  const riskLevel = classifyRisk(action);

  // Düşük riskli ve daha önce 3+ kez onaylanmışsa otomatik onayla
  if (riskLevel === "LOW" && similarApproved >= 3) {
    return {
      action,
      riskLevel,
      autoApproved: true,
      reason: `Daha önce ${similarApproved} kez onaylanmış benzer işlem. Otomatik onaylandı.`,
    };
  }

  // Orta riskli ve daha önce 5+ kez onaylanmışsa otomatik onayla
  if (riskLevel === "MEDIUM" && similarApproved >= 5) {
    return {
      action,
      riskLevel,
      autoApproved: true,
      reason: `Daha önce ${similarApproved} kez onaylanmış benzer işlem. Otomatik onaylandı.`,
    };
  }

  // Yüksek ve kritik işlemler her zaman onay ister
  return {
    action,
    riskLevel,
    autoApproved: false,
    reason: `${riskLevel} risk seviyesi Patron onayı gerektirir.`,
  };
}

function classifyRisk(action: string): string {
  const lower = action.toLowerCase();
  
  if (lower.includes("sil") || lower.includes("delete") || lower.includes("remove")) return "HIGH";
  if (lower.includes("ödeme") || lower.includes("payment") || lower.includes("şifre")) return "CRITICAL";
  if (lower.includes("oluştur") || lower.includes("create") || lower.includes("kod")) return "MEDIUM";
  
  return "LOW";
}

function extractKeywords(action: string): string {
  return action
    .replace(/[?.,!;:()]/g, "")
    .split(/\s+/)
    .slice(0, 3)
    .join(" ");
}

// BEE'nin öğrenme raporu
export async function getAutonomyReport() {
  const [total, approved, autoApproved, denied] = await Promise.all([
    prisma.permission.count(),
    prisma.permission.count({ where: { status: "approved" } }),
    prisma.permission.count({ where: { status: "approved", riskLevel: "LOW" } }),
    prisma.permission.count({ where: { status: { not: "approved" } } }),
  ]);

  const autonomyRate = total > 0 ? Math.round((autoApproved / total) * 100) : 0;

  return {
    totalDecisions: total,
    approved,
    autoApproved,
    denied,
    autonomyRate,
    message:
      autonomyRate > 50
        ? "BEE çoğu düşük riskli kararı kendi alabiliyor."
        : "BEE henüz öğrenme aşamasında, daha fazla onay gerekiyor.",
  };
}