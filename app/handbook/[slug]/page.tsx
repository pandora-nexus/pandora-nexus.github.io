import Link from "next/link";

interface Document {
  id: string;
  title: string;
  slug: string;
  content: string;
}

export default async function HandbookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let doc: Document | null = null;
  let error = "";

  try {
    const res = await fetch(`http://localhost:3000/api/documents/${slug}`, {
      cache: "no-store",
    });
    if (res.ok) {
      doc = await res.json();
    } else {
      error = "Document not found.";
    }
  } catch {
    error = "Failed to load document.";
  }

  if (error || !doc) {
    return (
      <div className="min-h-screen bg-black text-white font-mono p-10">
        <Link href="/handbook" className="text-gray-500 hover:text-white text-sm mb-8 block">
          ← Handbook
        </Link>
        <p className="text-red-400">{error || "Document not found."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono p-10 max-w-4xl mx-auto">
      <Link href="/handbook" className="text-gray-500 hover:text-white text-sm mb-8 block">
        ← Handbook
      </Link>
      <h1 className="text-3xl font-bold mb-8">{doc.title}</h1>
      <pre className="whitespace-pre-wrap text-sm text-gray-300 leading-relaxed">
        {doc.content}
      </pre>
    </div>
  );
}