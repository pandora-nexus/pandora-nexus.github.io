import { exec } from "child_process";
import { promisify } from "util";
import { prisma } from "@/lib/prisma";

const execAsync = promisify(exec);

interface UpdateReport {
  vulnerabilities: number;
  critical: number;
  high: number;
  moderate: number;
  low: number;
  recommendations: string[];
  timestamp: string;
}

export async function runSecurityAudit(): Promise<UpdateReport> {
  try {
    const { stdout } = await execAsync("npm audit --json", { cwd: process.cwd() });
    const audit = JSON.parse(stdout);

    const vulns = audit.vulnerabilities || {};
    let critical = 0, high = 0, moderate = 0, low = 0;
    const recommendations: string[] = [];

    for (const [name, data] of Object.entries(vulns)) {
      const v = data as any;
      if (v.severity === "critical") critical++;
      if (v.severity === "high") high++;
      if (v.severity === "moderate") moderate++;
      if (v.severity === "low") low++;

      if (v.severity === "critical" || v.severity === "high") {
        recommendations.push(`${name}: ${v.severity} — "${v.title}" düzeltmek için: npm audit fix`);
      }
    }

    const report = {
      vulnerabilities: critical + high + moderate + low,
      critical,
      high,
      moderate,
      low,
      recommendations: recommendations.slice(0, 5),
      timestamp: new Date().toISOString(),
    };

    // Öğrenme kaydı olarak sakla
    await prisma.learning.create({
      data: {
        category: "update",
        title: `Güvenlik Denetimi: ${report.vulnerabilities} açık bulundu`,
        description: `${report.critical} kritik, ${report.high} yüksek, ${report.moderate} orta, ${report.low} düşük`,
        source: "auto_updater",
      },
    });

    return report;
  } catch (error: any) {
    // npm audit başarısız olursa (ör: --json desteklenmiyorsa)
    return {
      vulnerabilities: 0,
      critical: 0,
      high: 0,
      moderate: 0,
      low: 0,
      recommendations: ["npm audit çalıştırılamadı. Manuel kontrol gerekli."],
      timestamp: new Date().toISOString(),
    };
  }
}

export async function checkForUpdates(): Promise<string[]> {
  try {
    const { stdout } = await execAsync("npm outdated --json", { cwd: process.cwd() });
    const outdated = JSON.parse(stdout);
    const updates: string[] = [];

    for (const [name, data] of Object.entries(outdated)) {
      const d = data as any;
      updates.push(`${name}: ${d.current} → ${d.latest} (${d.type})`);
    }

    return updates;
  } catch {
    return [];
  }
}