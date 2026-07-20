import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const GITHUB_RAW = "https://raw.githubusercontent.com/pandora-nexus/docs/main/00_CORE";

const files = [
  "VISION.md",
  "MISSION.md",
  "COMPANY_VALUES.md",
  "MOTTO.md",
  "GLOSSARY.md",
  "COMPANY_HISTORY.md",
  "ROADMAP.md",
  "ENGINEERING_SYSTEM.md",
  "AICOS_BLUEPRINT.md",
  "AICOS_MASTER_PLAN.md",
  "GITHUB_SETUP.md",
  "VERSION.md",
  "CHANGELOG.md",
];

export async function GET() {
  let updated = 0;
  let failed = 0;

  for (const file of files) {
    try {
      const res = await fetch(`${GITHUB_RAW}/${file}`, {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
        },
      });

      if (!res.ok) {
        failed++;
        continue;
      }

      const content = await res.text();
      const slug = file.replace(".md", "").toLowerCase();
      const typeMap: Record<string, string> = {
        vision: "vision",
        mission: "mission",
        company_values: "values",
        motto: "motto",
        glossary: "glossary",
        company_history: "history",
        roadmap: "roadmap",
        engineering_system: "engineering",
        aicos_blueprint: "blueprint",
        aicos_master_plan: "master-plan",
        github_setup: "github",
        version: "version",
        changelog: "changelog",
      };

      await prisma.document.upsert({
        where: { slug },
        update: { content },
        create: {
          title: file,
          slug,
          content,
          type: typeMap[slug] || "document",
        },
      });

      updated++;
    } catch {
      failed++;
    }
  }

  // İndeksi güncelle
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "Document" SET search_vector = to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))`
    );
  } catch {
    // İndeks güncelleme başarısız olursa devam et
  }

  return NextResponse.json({
    message: "Seed completed from GitHub",
    updated,
    failed,
    total: files.length,
  });
}