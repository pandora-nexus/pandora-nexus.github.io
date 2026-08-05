import fs from "fs";
import path from "path";

interface CodeIssue {
  file: string;
  line: number;
  type: "bug" | "performance" | "security" | "style" | "unused";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  suggestion: string;
}

export async function scanSourceCode(): Promise<{
  filesScanned: number;
  issues: CodeIssue[];
  summary: string;
}> {
  const issues: CodeIssue[] = [];
  let filesScanned = 0;

  const scanDir = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
          scanDir(fullPath);
        }
      } else if (
        entry.name.endsWith(".ts") ||
        entry.name.endsWith(".tsx") ||
        entry.name.endsWith(".js")
      ) {
        filesScanned++;
        const content = fs.readFileSync(fullPath, "utf-8");
        const lines = content.split("\n");

        lines.forEach((line, index) => {
          // Gereksiz console.log tespiti
          if (line.includes("console.log") && !line.includes("//") && !line.includes("error")) {
            issues.push({
              file: fullPath.replace(process.cwd(), ""),
              line: index + 1,
              type: "style",
              severity: "low",
              description: "console.log() bulundu. Production'da kaldırılmalı.",
              suggestion: "console.log() yerine proper logger kullanın veya kaldırın.",
            });
          }

          // TODO yorumları tespiti
          if (line.includes("// TODO") || line.includes("// FIXME")) {
            issues.push({
              file: fullPath.replace(process.cwd(), ""),
              line: index + 1,
              type: "style",
              severity: "low",
              description: "TODO/FIXME yorumu bulundu.",
              suggestion: "Bu yorumu bir GitHub Issue'ya dönüştürün.",
            });
          }

          // Boş catch blokları
          if (line.trim() === "} catch {}" || line.trim() === "} catch {}") {
            issues.push({
              file: fullPath.replace(process.cwd(), ""),
              line: index + 1,
              type: "bug",
              severity: "medium",
              description: "Boş catch bloğu tespit edildi. Hatalar sessizce yutuluyor.",
              suggestion: "En azından hatayı log'a yazın: catch (e) { console.error(e); }",
            });
          }

          // Hardcoded API anahtarı kontrolü
          if (
            (line.includes("sk-") || line.includes("api_key") || line.includes("secret")) &&
            !line.includes("process.env") &&
            !line.includes("import")
          ) {
            issues.push({
              file: fullPath.replace(process.cwd(), ""),
              line: index + 1,
              type: "security",
              severity: "critical",
              description: "Potansiyel hardcoded API anahtarı veya secret tespit edildi!",
              suggestion: "Bu değeri .env dosyasına taşıyın ve process.env ile okuyun.",
            });
          }
        });
      }
    }
  };

  // app/ ve lib/ klasörlerini tara
  scanDir(path.join(process.cwd(), "app"));
  scanDir(path.join(process.cwd(), "lib"));

  const critical = issues.filter(i => i.severity === "critical").length;
  const high = issues.filter(i => i.severity === "high").length;
  const medium = issues.filter(i => i.severity === "medium").length;
  const low = issues.filter(i => i.severity === "low").length;

  return {
    filesScanned,
    issues: issues.slice(0, 50),
    summary: `${filesScanned} dosya tarandı. ${critical} kritik, ${high} yüksek, ${medium} orta, ${low} düşük öncelikli sorun bulundu.`,
  };
}