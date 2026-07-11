import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const seedData = [
  {
    title: "VISION.md",
    slug: "vision",
    content: "PANDORA is the first name the world thinks of when it hears 'technology' — an independent technology organism shaping humanity's future.",
    type: "vision",
  },
  {
    title: "MISSION.md",
    slug: "mission",
    content: "To build a living technology organism that organizes AIs as a cohesive team, accumulates knowledge in company memory, and evolves with every project.",
    type: "mission",
  },
  {
    title: "COMPANY_VALUES.md",
    slug: "company-values",
    content: "The 10 Golden Rules are the unchanging constitution of PANDORA. Every AI, every project, every decision must respect them.",
    type: "values",
  },
  {
    title: "MOTTO.md",
    slug: "motto",
    content: "Think. Build. Evolve.",
    type: "motto",
  },
  {
    title: "GLOSSARY.md",
    slug: "glossary",
    content: "AICOS: AI Company Operating System. The central nervous system of PANDORA.",
    type: "glossary",
  },
  {
    title: "COMPANY_HISTORY.md",
    slug: "company-history",
    content: "Decision-001 — Company Founded. PANDORA was officially founded.",
    type: "history",
  },
  {
    title: "ROADMAP.md",
    slug: "roadmap",
    content: "Phase 0: Seed (2026–2027) — Lay foundations, build AICOS and BEE prototypes.",
    type: "roadmap",
  },
  {
    title: "ENGINEERING_SYSTEM.md",
    slug: "engineering-system",
    content: "Writing code at PANDORA is a discipline. Not speed, but correctness; not quantity, but quality.",
    type: "engineering",
  },
  {
    title: "AICOS_BLUEPRINT.md",
    slug: "aicos-blueprint",
    content: "AICOS is the central nervous system of PANDORA. It orchestrates all engines.",
    type: "blueprint",
  },
  {
    title: "AICOS_MASTER_PLAN.md",
    slug: "aicos-master-plan",
    content: "The strategic implementation plan for bringing all AICOS components to life.",
    type: "master-plan",
  },
  {
    title: "GITHUB_SETUP.md",
    slug: "github-setup",
    content: "Step-by-step guide for creating the PANDORA GitHub organization.",
    type: "github",
  },
  {
    title: "VERSION.md",
    slug: "version",
    content: "Current version: Genesis v0.1.0. System not yet stable, foundations being laid.",
    type: "version",
  },
  {
    title: "CHANGELOG.md",
    slug: "changelog",
    content: "All notable changes to the PANDORA ecosystem are documented in this file.",
    type: "changelog",
  },
];

export async function GET() {
  try {
    for (const doc of seedData) {
      await prisma.document.upsert({
        where: { slug: doc.slug },
        update: doc,
        create: doc,
      });
    }
    return NextResponse.json({ message: "Seed completed", count: seedData.length });
  } catch (error) {
    return NextResponse.json({ error: "Seed failed", details: String(error) }, { status: 500 });
  }
}