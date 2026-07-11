import Link from "next/link";

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

export default function Handbook() {
  return (
    <div className="min-h-screen bg-black text-white font-mono p-10">
      <Link href="/" className="text-gray-500 hover:text-white text-sm mb-8 block">
        ← Home
      </Link>
      <h1 className="text-4xl font-bold mb-4">PANDORA Handbook</h1>
      <p className="text-gray-500 mb-10">The living documentation of the organization.</p>
      <div className="grid md:grid-cols-2 gap-4 max-w-3xl">
        {files.map((file) => {
          const slug = file.replace(".md", "").toLowerCase();
          return (
            <Link
              key={file}
              href={`/handbook/${slug}`}
              className="border border-gray-800 p-4 hover:border-gray-400 transition text-sm"
            >
              {file}
            </Link>
          );
        })}
      </div>
    </div>
  );
}