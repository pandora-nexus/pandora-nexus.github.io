import { prisma } from "@/lib/prisma";

interface SkillBuildResult {
  skillName: string;
  researchSummary: string;
  resourcesFound: number;
  knowledgeUpdated: boolean;
  nextSteps: string[];
}

export async function buildSkill(skillName: string): Promise<SkillBuildResult> {
  // 1. Skill'in zaten var olup olmadığını kontrol et
  const existingSkill = await prisma.learning.findFirst({
    where: {
      category: "skill",
      title: { contains: skillName },
      status: "active",
    },
  });

  if (existingSkill) {
    return {
      skillName,
      researchSummary: `"${skillName}" zaten öğrenilmiş ve aktif.`,
      resourcesFound: 0,
      knowledgeUpdated: false,
      nextSteps: ["Bu yeteneği kullanarak bir proje başlat."],
    };
  }

  // 2. Araştırma yap (web scraping simülasyonu)
  const researchResult = await researchSkill(skillName);

  // 3. Öğrenme kaydını oluştur
  await prisma.learning.create({
    data: {
      category: "skill",
      title: `Skill: ${skillName}`,
      description: researchResult,
      source: "skill_builder",
      status: "active",
    },
  });

  // 4. Tool Registry'yi güncelle (eğer ilgili bir araç varsa)
  const relatedTools = await prisma.toolRegistry.findMany({
    where: {
      OR: [
        { toolName: { contains: skillName } },
        { category: { contains: skillName } },
        { description: { contains: skillName } },
      ],
    },
  });

  if (relatedTools.length > 0) {
    for (const tool of relatedTools) {
      await prisma.toolRegistry.update({
        where: { id: tool.id },
        data: { integrationStatus: "planned" },
      });
    }
  }

  // 5. Sonuçları döndür
  const nextSteps = generateNextSteps(skillName, relatedTools.length);

  return {
    skillName,
    researchSummary: researchResult.substring(0, 500) + "...",
    resourcesFound: relatedTools.length,
    knowledgeUpdated: true,
    nextSteps,
  };
}

async function researchSkill(skillName: string): Promise<string> {
  // Serper.dev ile web araştırması
  const serperKey = process.env.SERPER_API_KEY;
  let webSummary = "";

  if (serperKey) {
    try {
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": serperKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ q: `${skillName} tutorial beginner guide`, num: 5 }),
      });

      if (res.ok) {
        const data = await res.json();
        const snippets = data.organic?.map((r: any) => `• ${r.title}: ${r.snippet}`).join("\n") || "";
        webSummary = `\n\n🌐 Web Araştırması:\n${snippets}`;
      }
    } catch {}
  }

  return `Yeni yetenek araştırması: "${skillName}"\n\nTemel kavramlar ve en iyi uygulamalar öğrenildi.${webSummary}`;
}

function generateNextSteps(skillName: string, toolCount: number): string[] {
  const steps = [
    `${skillName} ile ilgili temel egzersizleri tamamla.`,
    `${skillName} kullanarak küçük bir demo projesi oluştur.`,
  ];

  if (toolCount > 0) {
    steps.push(`Tool Registry'de ${toolCount} ilgili araç bulundu. Entegrasyonları planlandı.`);
  }

  steps.push(`Öğrenilenleri Knowledge Base'e kaydet.`);
  return steps;
}

export async function listSkills() {
  return prisma.learning.findMany({
    where: { category: "skill", status: "active" },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, description: true, createdAt: true },
  });
}