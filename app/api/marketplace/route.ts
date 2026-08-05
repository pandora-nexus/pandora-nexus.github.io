import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const type = searchParams.get("type"); // "skills" veya "tools"

  const marketplaceItems: any[] = [];

  // Skill'leri getir
  if (!type || type === "skills") {
    const skills = await prisma.learning.findMany({
      where: {
        category: "skill",
        status: "active",
        ...(category ? { title: { contains: category } } : {}),
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, description: true, createdAt: true },
    });

    skills.forEach(skill => {
      marketplaceItems.push({
        type: "skill",
        name: skill.title.replace("Skill: ", ""),
        description: skill.description?.substring(0, 200) + "...",
        author: "BEE",
        downloads: 0,
        rating: 5.0,
        createdAt: skill.createdAt,
      });
    });
  }

  // Tool'ları getir
  if (!type || type === "tools") {
    const tools = await prisma.toolRegistry.findMany({
      where: {
        ...(category ? { category } : {}),
      },
      orderBy: { toolName: "asc" },
      select: {
        id: true,
        toolName: true,
        description: true,
        category: true,
        license: true,
        isFree: true,
        costDescription: true,
        integrationStatus: true,
        createdAt: true,
      },
    });

    tools.forEach(tool => {
      marketplaceItems.push({
        type: "tool",
        name: tool.toolName,
        description: tool.description || "",
        category: tool.category,
        license: tool.license,
        isFree: tool.isFree,
        costDescription: tool.costDescription,
        integrationStatus: tool.integrationStatus,
        createdAt: tool.createdAt,
      });
    });
  }

  return NextResponse.json({
    total: marketplaceItems.length,
    items: marketplaceItems,
  });
}