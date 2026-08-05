import { prisma } from "@/lib/prisma";

const DEPARTMENT_KEYWORDS: Record<string, string[]> = {
  "Game Development": ["godot", "unity", "unreal", "oyun", "game", "sprite", "level", "physics", "animation", "character"],
  "Engineering": ["api", "backend", "frontend", "database", "docker", "prisma", "next.js", "typescript", "react"],
  "Research": ["paper", "research", "study", "analysis", "trend", "technology", "innovation"],
  "Creative": ["blender", "3d", "model", "texture", "render", "design", "ui", "ux", "color"],
  "Robotics": ["arduino", "raspberry", "sensor", "motor", "ros", "robot", "kinematics"],
  "Security": ["encryption", "firewall", "vulnerability", "penetration", "audit", "compliance"],
  "Business": ["revenue", "cost", "market", "strategy", "roi", "budget", "finance"],
  "Knowledge Management": ["documentation", "memory", "knowledge", "learning", "evolution"],
};

export async function scanForCrossDepartmentInsights() {
  console.log("🔍 Departmanlar arası içgörü taraması başlıyor...");

  // Tüm aktif öğrenme kayıtlarını al
  const learnings = await prisma.learning.findMany({
    where: { status: "active" },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Tüm aktif projeleri al
  const projects = await prisma.gameProject.findMany({
    where: { status: "active" },
  });

  let insightsCreated = 0;

  for (const learning of learnings) {
    const sourceDept = detectDepartment(learning.title + " " + learning.description);
    if (!sourceDept) continue;

    // Bu öğrenmenin hangi departmanlara faydalı olabileceğini bul
    const targetDepts = findRelevantDepartments(learning.title + " " + learning.description, sourceDept);

    for (const targetDept of targetDepts) {
      // Zaten var mı kontrol et
      const existing = await prisma.crossDepartmentInsight.findFirst({
        where: {
          sourceDept,
          targetDept,
          title: learning.title,
        },
      });

      if (!existing) {
        const relevanceScore = calculateRelevance(learning.description, targetDept);
        
        await prisma.crossDepartmentInsight.create({
          data: {
            sourceDept,
            targetDept,
            title: learning.title,
            description: learning.description.substring(0, 500),
            relevanceScore,
            status: "proposed",
          },
        });

        insightsCreated++;
      }
    }
  }

  console.log(`✅ ${insightsCreated} departmanlar arası içgörü oluşturuldu.`);
  return insightsCreated;
}

function detectDepartment(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [dept, keywords] of Object.entries(DEPARTMENT_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return dept;
    }
  }
  return null;
}

function findRelevantDepartments(text: string, excludeDept: string): string[] {
  const lower = text.toLowerCase();
  const relevant: string[] = [];

  for (const [dept, keywords] of Object.entries(DEPARTMENT_KEYWORDS)) {
    if (dept === excludeDept) continue;
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        if (!relevant.includes(dept)) relevant.push(dept);
      }
    }
  }

  return relevant.length > 0 ? relevant : Object.keys(DEPARTMENT_KEYWORDS).filter(d => d !== excludeDept).slice(0, 2);
}

function calculateRelevance(text: string, targetDept: string): number {
  const keywords = DEPARTMENT_KEYWORDS[targetDept] || [];
  const lower = text.toLowerCase();
  let matches = 0;
  for (const kw of keywords) {
    if (lower.includes(kw)) matches++;
  }
  return Math.min(matches / Math.max(keywords.length, 1), 1.0);
}

export async function getPendingInsights() {
  return prisma.crossDepartmentInsight.findMany({
    where: { status: "proposed" },
    orderBy: { relevanceScore: "desc" },
    take: 10,
  });
}