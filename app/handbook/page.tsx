import Link from "next/link";

interface Document {
  id: string;
  title: string;
  slug: string;
  type: string;
}

export default async function Handbook() {
  let docs: Document[] = [];
  try {
    const res = await fetch("http://localhost:3000/api/documents", {
      cache: "no-store",
    });
    if (res.ok) {
      docs = await res.json();
    }
  } catch {
    // Fallback: boş liste
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono p-10">
      <Link href="/" className="text-gray-500 hover:text-white text-sm mb-8 block">
        ← Home
      </Link>
      <h1 className="text-4xl font-bold mb-4">PANDORA Handbook</h1>
      <p className="text-gray-500 mb-10">The living documentation of the organization.</p>
      <div className="grid md:grid-cols-2 gap-4 max-w-3xl">
        {docs.map((doc) => (
          <Link
            key={doc.id}
            href={`/handbook/${doc.slug}`}
            className="border border-gray-800 p-4 hover:border-gray-400 transition text-sm"
          >
            {doc.title}
          </Link>
        ))}
      </div>
    </div>
  );
}