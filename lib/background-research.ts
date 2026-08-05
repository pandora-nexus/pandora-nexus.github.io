import { prisma } from "@/lib/prisma";

interface ResearchTask {
  roomId: string;
  roomName: string;
  keywords: string[];
}

export async function collectResearchTasks(): Promise<ResearchTask[]> {
  const rooms = await prisma.chatRoom.findMany({
    where: { 
      isActive: true,
      type: "project"  // SADECE proje odalarında araştırma yap
    },
    select: { id: true, name: true },
  });

  const tasks: ResearchTask[] = [];

  for (const room of rooms) {
    // Her odanın son mesajlarından anahtar kelimeleri çıkar
    const recentMessages = await prisma.message.findMany({
      where: { roomId: room.id, role: "user" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { content: true },
    });

    const keywords = extractKeywords(recentMessages.map(m => m.content));
    if (keywords.length > 0) {
      tasks.push({
        roomId: room.id,
        roomName: room.name,
        keywords,
      });
    }
  }

  return tasks;
}

function extractKeywords(messages: string[]): string[] {
  const stopWords = [
    "bir", "ve", "bu", "ne", "nedir", "nasıl", "için", "ile", "ama", "gibi", 
    "daha", "çok", "the", "is", "what", "how", "a", "an",
    "nasılsın", "selam", "merhaba", "iyiyim", "seni", "görmek", "güzel", 
    "söyle", "bakalım", "bugün", "var", "yok", "teşekkür", "sağol", "eyvallah",
    "bee", "patron", "tamam", "oldu", "peki", "hadi", "evet", "hayır"
  ];
  
  const allWords = messages
    .join(" ")
    .toLowerCase()
    .replace(/[?.,!;:()]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.includes(w));

  // En sık geçen 5 kelimeyi al
  const freq: Record<string, number> = {};
  allWords.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(e => e[0]);
}

export async function executeResearch(task: ResearchTask): Promise<string | null> {
  const serperKey = process.env.SERPER_API_KEY;
  if (!serperKey) return null;

  const query = task.keywords.join(" ");
  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" },
      body: JSON.stringify({ q: query, num: 3 }),
    });

    if (!res.ok) return null;
    const data = await res.json();

    if (data.organic && data.organic.length > 0) {
      const findings = data.organic
        .map((r: any) => `• ${r.title}: ${r.snippet}`)
        .join("\n");

      // Araştırma sonucunu odaya BEE mesajı olarak kaydet
      const report = `🔍 **Arkaplan Araştırması — "${task.roomName}"**\n\nAnahtar kelimeler: ${task.keywords.join(", ")}\n\n${findings}\n\n📌 Önemli bir şey var mı Patron?`;

      await prisma.message.create({
        data: {
          roomId: task.roomId,
          role: "bee",
          content: report,
        },
      });

      // Öğrenme kaydı oluştur
      await prisma.learning.create({
        data: {
          category: "research",
          title: `Background Research: ${task.roomName}`,
          description: findings.substring(0, 500),
          source: "background_research_engine",
        },
      });

      return report;
    }
  } catch {}

  return null;
}

export async function runBackgroundResearch() {
  console.log("🔍 Arkaplan araştırması başlıyor...");
  const tasks = await collectResearchTasks();

  for (const task of tasks) {
    const result = await executeResearch(task);
    if (result) {
      console.log(`✅ Araştırma tamamlandı: ${task.roomName} (${task.keywords.join(", ")})`);
    }
  }

  console.log(`📊 Toplam ${tasks.length} oda için araştırma yapıldı.`);
}