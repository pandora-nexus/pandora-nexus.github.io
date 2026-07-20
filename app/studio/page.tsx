import Link from "next/link";

export default function Studio() {
  return (
    <div className="min-h-screen bg-black text-white font-mono p-10">
      <Link href="/" className="text-gray-500 hover:text-white text-sm mb-8 block">
        ← Home
      </Link>
      <h1 className="text-4xl font-bold mb-4">🐝 BEE Studio</h1>
      <p className="text-gray-500 mb-10">PANDORA's game development studio.</p>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
        {/* Oyun Kartı */}
        <div className="border border-gray-800 p-6 hover:border-yellow-500 transition">
          <h2 className="text-xl font-bold mb-2">Project: BEE Runner</h2>
          <p className="text-gray-500 text-sm mb-4">
            İlk PANDORA oyunu. BEE ile engelleri aş, puan topla.
          </p>
          <span className="text-xs bg-yellow-500 text-black px-2 py-1">In Development</span>
        </div>

        {/* Gelecek Oyunlar */}
        <div className="border border-gray-800 p-6 opacity-50">
          <h2 className="text-xl font-bold mb-2">Project: AICOS Tower</h2>
          <p className="text-gray-500 text-sm mb-4">
            Kule savunma oyunu. Guardian kuleleriyle dalgaları durdur.
          </p>
          <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1">Planned</span>
        </div>

        <div className="border border-gray-800 p-6 opacity-50">
          <h2 className="text-xl font-bold mb-2">Project: Nexus Quest</h2>
          <p className="text-gray-500 text-sm mb-4">
            RPG macerası. PANDORA evreninde keşif ve görevler.
          </p>
          <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1">Planned</span>
        </div>

        <div className="border border-gray-800 p-6 opacity-50">
          <h2 className="text-xl font-bold mb-2">Project: Memory Maze</h2>
          <p className="text-gray-500 text-sm mb-4">
            Bulmaca oyunu. Knowledge Engine ile labirentten çık.
          </p>
          <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1">Planned</span>
        </div>
      </div>
    </div>
  );
}