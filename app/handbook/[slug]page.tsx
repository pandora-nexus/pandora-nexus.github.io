import Link from "next/link";

const fileMap: Record<string, string> = {
  vision: "VISION.md",
  mission: "MISSION.md",
  company_values: "COMPANY_VALUES.md",
  motto: "MOTTO.md",
  glossary: "GLOSSARY.md",
  company_history: "COMPANY_HISTORY.md",
  roadmap: "ROADMAP.md",
  engineering_system: "ENGINEERING_SYSTEM.md",
  aicos_blueprint: "AICOS_BLUEPRINT.md",
  aicos_master_plan: "AICOS_MASTER_PLAN.md",
  github_setup: "GITHUB_SETUP.md",
  version: "VERSION.md",
  changelog: "CHANGELOG.md",
};

export default async function HandbookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const fileName = fileMap[slug];
  const repoUrl = `https://raw.githubusercontent.com/pandora-nexus/docs/main/00_CORE/${fileName}`;

  let content = "";
  try {
    const res = await fetch(repoUrl, { cache: "no-store" });
    if (res.ok) {
      content = await res.text();
    } else {
      content = "Document not found.";
    }
  } catch {
    content = "Failed to load document.";
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono p-10 max-w-4xl mx-auto">
      <Link href="/handbook" className="text-gray-500 hover:text-white text-sm mb-8 block">
        ← Handbook
      </Link>
      <h1 className="text-3xl font-bold mb-8">{fileName}</h1>
      <pre className="whitespace-pre-wrap text-sm text-gray-300 leading-relaxed">
        {content}
      </pre>
    </div>
  );
}