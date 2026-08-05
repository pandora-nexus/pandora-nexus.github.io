import cron from "node-cron";
import { runBackgroundResearch } from "@/lib/background-research";
import { runSecurityAudit } from "@/lib/auto-updater";
import { runStabilityCheck } from "@/lib/system-stability";

export function startCronJobs() {
  // Her gün saat 09:00'da günlük rapor + proaktif öneriler + bildirim
  cron.schedule("0 9 * * *", async () => {
    try {
      const res = await fetch("http://localhost:3000/api/cron/daily-report");
      if (res.ok) {
        const report = await res.json();
        console.log("📊 Daily Report:", report.summary);

        // Proaktif öneri oluştur
        const suggestions: string[] = [];
        if (report.summary.activeLearningRecords > 0) {
          suggestions.push(`${report.summary.activeLearningRecords} öğrenme kaydı gözden geçirilmeyi bekliyor.`);
        }
        if (report.summary.totalConversations === 0) {
          suggestions.push("Bugün henüz hiç soru sormadın. Bir şeyler konuşalım mı?");
        }
        if (report.summary.totalDocuments < 20) {
          suggestions.push("Dokümantasyon sayısı 20'nin altında. Yeni belge eklemek ister misin?");
        }

        if (suggestions.length > 0) {
          console.log("💡 Proaktif Öneriler:");
          suggestions.forEach(s => console.log(`   • ${s}`));

          // Bildirim olarak da gönder
          try {
            await fetch("http://localhost:3000/api/notify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: "☀️ Günaydın Patron!",
                message: suggestions.join("\n"),
              }),
            });
          } catch {
            console.error("❌ Bildirim gönderilemedi");
          }
        }
      }
    } catch (error) {
      console.error("❌ Daily report failed:", error);
    }
  });

  // Her saat başı sağlık kontrolü
  cron.schedule("0 * * * *", async () => {
    try {
      const { prisma } = await import("@/lib/prisma");
      await prisma.$queryRawUnsafe(`SELECT 1`);
      console.log("✅ Health check passed");
    } catch {
      console.error("❌ Database connection failed");
    }
  });

  // Her 30 dakikada bir arkaplan araştırması
  cron.schedule("*/30 * * * *", async () => {
    try {
      await runBackgroundResearch();
    } catch (error) {
      console.error("❌ Background research failed:", error);
    }
  });

  // Her gece 03:00'te güvenlik denetimi
  cron.schedule("0 3 * * *", async () => {
    try {
      const report = await runSecurityAudit();
      if (report.critical > 0 || report.high > 0) {
        console.log(`⚠️ Güvenlik uyarısı: ${report.critical} kritik, ${report.high} yüksek açık!`);
      } else {
        console.log(`✅ Güvenlik denetimi temiz.`);
      }
    } catch (error) {
      console.error("❌ Güvenlik denetimi başarısız:", error);
    }
  });

  // Her 6 saatte bir stabilite kontrolü
  cron.schedule("0 */6 * * *", async () => {
    try {
      const report = await runStabilityCheck();
      console.log(`🔧 Stabilite raporu: ${report.recommendations.length} öneri`);
      if (report.recommendations.length > 0) {
        report.recommendations.forEach(r => console.log(`   • ${r}`));
      }
    } catch (error) {
      console.error("❌ Stabilite kontrolü başarısız:", error);
    }
  });

  console.log("⏰ Automation Engine started");
}