import { prisma } from "@/lib/prisma";

interface StrategicAnalysis {
  overallHealth: string;
  bottlenecks: string[];
  recommendations: string[];
  projectInsights: string;
  timestamp: string;
}

export async function generateStrategicAnalysis(): Promise<StrategicAnalysis> {
  const [
    docCount, convCount, learningCount, projectCount, gameCount,
    aiCount, toolCount, pendingPermissions, pendingEvolutions,
  ] = await Promise.all([
    prisma.document.count(),
    prisma.conversation.count(),
    prisma.learning.count({ where: { status: "active" } }),
    prisma.project.count(),
    prisma.gameProject.count(),
    prisma.aIRegistry.count({ where: { status: "active" } }),
    prisma.toolRegistry.count({ where: { integrationStatus: "active" } }),
    prisma.permission.count({ where: { status: "pending" } }),
    prisma.knowledgeEvolution.count({ where: { status: "proposed" } }),
  ]);

  const bottlenecks: string[] = [];
  const recommendations: string[] = [];

  // Bilgi tabanı analizi
  if (docCount < 20) {
    bottlenecks.push(`Bilgi tabanı sınırlı: ${docCount} belge.`);
    recommendations.push("00_CORE/ belgelerini genişlet veya yeni araştırma yap.");
  }
  if (pendingEvolutions > 0) {
    bottlenecks.push(`${pendingEvolutions} onay bekleyen bilgi güncellemesi var.`);
    recommendations.push("Dashboard'dan Knowledge Evolution önerilerini incele.");
  }

  // Güvenlik analizi
  if (pendingPermissions > 0) {
    bottlenecks.push(`${pendingPermissions} bekleyen güvenlik izni var.`);
    recommendations.push("Permission panelinden bekleyen istekleri onayla veya reddet.");
  }

  // Proje analizi
  if (projectCount === 0 && gameCount === 0) {
    bottlenecks.push("Hiç aktif proje yok.");
    recommendations.push("BEE'ye 'yeni bir proje başlatalım' diyerek başlangıç yap.");
  }
  if (gameCount > 0 && aiCount < 3) {
    recommendations.push("Oyun projeleri için daha fazla AI modeli eklemeyi düşün (Gemini, Mistral vb.).");
  }

  // Araç analizi
  if (toolCount < 5) {
    recommendations.push("Tool Registry'deki araç sayısını artır. Unity, Blender, Godot entegrasyonlarını tamamla.");
  }

  const overallHealth =
    bottlenecks.length === 0
      ? "Mükemmel — Sistem tam kapasite çalışıyor."
      : bottlenecks.length <= 2
      ? "İyi — Birkaç iyileştirme noktası var."
      : "Geliştirilmeli — Kritik darboğazlar mevcut.";

  return {
    overallHealth,
    bottlenecks,
    recommendations,
    projectInsights: `Toplam ${projectCount} proje, ${gameCount} oyun projesi, ${docCount} belge, ${convCount} konuşma kaydı mevcut.`,
    timestamp: new Date().toISOString(),
  };
}