import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function generateHash(action: string, details: string, timestamp: string): string {
  return crypto.createHash("sha256").update(`${action}${details}${timestamp}`).digest("hex");
}

export async function auditLog(params: {
  action: string;
  category?: string;
  severity?: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  performedBy?: string;
  details?: string;
  ip?: string;
}) {
  const timestamp = new Date().toISOString();
  const hash = generateHash(params.action, params.details || "", timestamp);

  await prisma.auditLog.create({
    data: {
      action: params.action,
      category: params.category || "general",
      severity: params.severity || "INFO",
      performedBy: params.performedBy || "BEE",
      details: params.details || "",
      ip: params.ip || "",
      hash,
    },
  });
}