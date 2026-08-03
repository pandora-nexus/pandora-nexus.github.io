"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface GameProject {
  id: string;
  title: string;
  genre: string;
  engine: string;
  artStyle: string;
  platform: string;
  status: string;
  createdAt: string;
}

interface Asset {
  id: string;
  name: string;
  type: string;
  isFree: boolean;
  source: string;
}

interface GodotStatus {
  engine: string;
  version: string;
  status: string;
}

export default function Studio() {
  const [projects, setProjects] = useState<GameProject[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [godot, setGodot] = useState<GodotStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [projRes, assetRes, godotRes] = await Promise.all([
          fetch("/api/game-department"),
          fetch("/api/assets"),
          fetch("/api/godot"),
        ]);
        if (projRes.ok) setProjects(await projRes.json());
        if (assetRes.ok) setAssets(await assetRes.json());
        if (godotRes.ok) setGodot(await godotRes.json());
      } catch {}
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white font-mono p-10">
        <p>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono p-10">
      <Link href="/" className="text-gray-500 hover:text-white text-sm mb-8 block">
        ← Ana Sayfa
      </Link>
      <h1 className="text-4xl font-bold mb-2">🐝 BEE Studio</h1>
      <p className="text-gray-500 mb-8">PANDORA Oyun Geliştirme Kontrol Paneli</p>

      {/* Godot Durumu */}
      <div className="border border-gray-800 p-4 mb-8 max-w-2xl">
        <h2 className="text-sm font-bold text-yellow-500 mb-2">🕹️ Oyun Motoru</h2>
        {godot ? (
          <div className="text-sm text-green-400">
            Godot {godot.version} — {godot.status === "ready" ? "✅ Hazır" : "❌ Bağlı Değil"}
          </div>
        ) : (
          <div className="text-sm text-red-400">❌ Godot bulunamadı</div>
        )}
      </div>

      {/* Projeler */}
      <div className="mb-10">
        <h2 className="text-xl font-bold mb-4">📂 Projeler ({projects.length})</h2>
        <div className="grid md:grid-cols-2 gap-4 max-w-4xl">
          {projects.length === 0 && (
            <p className="text-gray-500 text-sm">Henüz proje yok. BEE'ye "oyun yap" diyerek başlayabilirsin.</p>
          )}
          {projects.map((p) => (
            <div key={p.id} className="border border-gray-800 p-4 hover:border-yellow-500 transition">
              <h3 className="font-bold">{p.title}</h3>
              <div className="text-xs text-gray-500 mt-2 space-y-1">
                <p>🎮 {p.genre} | 🕹️ {p.engine} | 🎨 {p.artStyle}</p>
                <p>🖥️ {p.platform}</p>
                <span className={`inline-block px-2 py-0.5 rounded text-xs mt-1 ${
                  p.status === "planning" ? "bg-yellow-500 text-black" :
                  p.status === "active" ? "bg-green-500 text-black" :
                  "bg-gray-700 text-gray-400"
                }`}>
                  {p.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Asset'ler */}
      <div>
        <h2 className="text-xl font-bold mb-4">🎨 Asset Kütüphanesi ({assets.length})</h2>
        <div className="grid md:grid-cols-3 gap-3 max-w-4xl">
          {assets.slice(0, 9).map((a) => (
            <div key={a.id} className="border border-gray-800 p-3 text-xs">
              <p className="font-bold truncate">{a.name}</p>
              <p className="text-gray-500">{a.type} | {a.isFree ? "🆓 Ücretsiz" : "💰 Ücretli"}</p>
              <p className="text-gray-600">{a.source}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}