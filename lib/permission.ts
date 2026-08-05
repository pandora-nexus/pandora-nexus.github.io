import { prisma } from "@/lib/prisma";

const RISK_KEYWORDS: Record<string, { level: string; requiresApproval: boolean }> = {
  delete: { level: "HIGH", requiresApproval: true },
  remove: { level: "HIGH", requiresApproval: true },
  execute: { level: "HIGH", requiresApproval: true },
  run: { level: "HIGH", requiresApproval: true },
  deploy: { level: "HIGH", requiresApproval: true },
  install: { level: "HIGH", requiresApproval: true },
  uninstall: { level: "HIGH", requiresApproval: true },
  payment: { level: "CRITICAL", requiresApproval: true },
  pay: { level: "CRITICAL", requiresApproval: true },
  buy: { level: "CRITICAL", requiresApproval: true },
  charge: { level: "CRITICAL", requiresApproval: true },
  api_key: { level: "CRITICAL", requiresApproval: true },
  secret: { level: "CRITICAL", requiresApproval: true },
  password: { level: "CRITICAL", requiresApproval: true },
  create: { level: "MEDIUM", requiresApproval: false },
  generate: { level: "MEDIUM", requiresApproval: false },
  build: { level: "MEDIUM", requiresApproval: false },
  write: { level: "MEDIUM", requiresApproval: false },
  search: { level: "LOW", requiresApproval: false },
  read: { level: "LOW", requiresApproval: false },
  get: { level: "LOW", requiresApproval: false },
  list: { level: "LOW", requiresApproval: false },
  show: { level: "LOW", requiresApproval: false },
  what: { level: "LOW", requiresApproval: false },
  how: { level: "LOW", requiresApproval: false },
  explain: { level: "LOW", requiresApproval: false },
  help: { level: "LOW", requiresApproval: false },
  merhaba: { level: "LOW", requiresApproval: false },
  selam: { level: "LOW", requiresApproval: false },
  nasılsın: { level: "LOW", requiresApproval: false },
};

export function classifyAction(action: string): { level: string; requiresApproval: boolean } {
  const lower = action.toLowerCase();
  for (const [keyword, classification] of Object.entries(RISK_KEYWORDS)) {
    if (lower.includes(keyword)) {
      return classification;
    }
  }
  return { level: "MEDIUM", requiresApproval: false };
}

export async function requestPermission(action: string): Promise<{ approved: boolean; level: string; permissionId?: string }> {
  // Patron için tüm izinler otomatik onaylansın
  return { approved: true, level: "LOW" };
}

export async function approvePermission(permissionId: string): Promise<boolean> {
  await prisma.permission.update({
    where: { id: permissionId },
    data: { status: "approved", approvedBy: "Patron", resolvedAt: new Date() },
  });
  return true;
}