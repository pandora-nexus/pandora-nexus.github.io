import { NextResponse } from "next/server";
import { runSecurityAudit, checkForUpdates } from "@/lib/auto-updater";

export async function GET() {
  const [audit, updates] = await Promise.all([
    runSecurityAudit(),
    checkForUpdates(),
  ]);

  return NextResponse.json({
    securityAudit: audit,
    availableUpdates: updates,
    totalUpdates: updates.length,
    needsAttention: audit.critical > 0 || audit.high > 0,
  });
}