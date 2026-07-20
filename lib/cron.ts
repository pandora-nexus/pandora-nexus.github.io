import cron from "node-cron";

export function startCronJobs() {
  // Her gün saat 09:00'da günlük rapor + proaktif öneriler
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

  console.log("⏰ Automation Engine started");
}