import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Hero */}
      <main className="flex flex-col items-center justify-center min-h-screen text-center px-6">
        <h1 className="text-6xl md:text-8xl font-bold tracking-widest mb-4">
          PANDORA
        </h1>
        <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mb-8">
          The living technology organism.
        </p>
        <p className="text-sm text-gray-500 max-w-xl mb-12">
          {`"To democratize technology in the service of humanity through a
          self-evolving, self-improving organism."`}
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link
            href="/ecosystem"
            className="border border-white px-6 py-3 hover:bg-white hover:text-black transition"
          >
            Ecosystem
          </Link>
          <Link
            href="/values"
            className="border border-white px-6 py-3 hover:bg-white hover:text-black transition"
          >
            Values
          </Link>
          <Link
            href="/handbook"
            className="border border-white px-6 py-3 hover:bg-white hover:text-black transition"
          >
            Handbook
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-0 w-full text-center py-6 text-xs text-gray-600">
        © {new Date().getFullYear()} PANDORA. Think. Build. Evolve.
      </footer>
    </div>
  );
}