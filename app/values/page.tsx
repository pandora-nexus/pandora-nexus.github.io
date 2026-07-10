import Link from "next/link";

const rules = [
  "Truth Before Speed",
  "Think Before Build",
  "Documentation Is Mandatory",
  "Security Is Never Optional",
  "Every Decision Has A Reason",
  "Everything Must Be Modular",
  "Knowledge Belongs To PANDORA",
  "Learn Forever",
  "Quality Before Quantity",
  "The Founder Makes Final Decisions",
];

export default function Values() {
  return (
    <div className="min-h-screen bg-black text-white font-mono p-10">
      <Link href="/" className="text-gray-500 hover:text-white text-sm mb-8 block">
        ← Home
      </Link>
      <h1 className="text-4xl font-bold mb-10">10 Golden Rules</h1>
      <ol className="list-decimal list-inside space-y-3 max-w-2xl text-gray-300">
        {rules.map((rule, i) => (
          <li key={i}>{rule}</li>
        ))}
      </ol>
      <p className="mt-10 text-gray-600 text-sm">
        These values are non-negotiable. They are the soul of PANDORA.
      </p>
    </div>
  );
}