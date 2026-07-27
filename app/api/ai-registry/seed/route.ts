import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const defaultAIs = [
  {
    modelName: "deepseek-chat",
    provider: "DeepSeek",
    apiEndpoint: "https://api.deepseek.com/v1/chat/completions",
    capabilities: JSON.stringify(["text", "coding", "reasoning", "planning"]),
    contextWindow: 128000,
    coding: true,
    reasoning: true,
    costPer1MTokens: "$0.14 / $0.28",
    strengths: JSON.stringify(["Fast", "Cheap", "Good at coding", "Turkish support"]),
    weaknesses: JSON.stringify(["Less creative", "Limited vision"]),
    supportedTasks: JSON.stringify(["code_generation", "project_planning", "documentation", "chat"]),
    securityLevel: "HIGH",
    status: "active",
  },
  {
    modelName: "claude-sonnet-5",
    provider: "Anthropic",
    apiEndpoint: "https://api.anthropic.com/v1/messages",
    capabilities: JSON.stringify(["text", "coding", "reasoning", "vision", "tool_calling"]),
    contextWindow: 1000000,
    coding: true,
    reasoning: true,
    toolCalling: true,
    costPer1MTokens: "$3.00 / $15.00",
    strengths: JSON.stringify(["Excellent code review", "Long context", "Nuanced reasoning", "Vision"]),
    weaknesses: JSON.stringify(["Expensive", "Slower than DeepSeek"]),
    supportedTasks: JSON.stringify(["code_review", "security_audit", "documentation", "research"]),
    securityLevel: "HIGH",
    status: "active",
  },
];

export async function GET() {
  let added = 0;
  for (const ai of defaultAIs) {
    const exists = await prisma.aIRegistry.findUnique({ where: { modelName: ai.modelName } });
    if (!exists) {
      await prisma.aIRegistry.create({ data: ai });
      added++;
    }
  }
  return NextResponse.json({ message: `AI Registry seeded`, added, total: defaultAIs.length });
}