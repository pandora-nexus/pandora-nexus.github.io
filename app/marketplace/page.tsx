"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface MarketplaceItem {
  type: "skill" | "tool";
  name: string;
  description: string;
  category?: string;
  license?: string;
  isFree?: boolean;
  costDescription?: string;
  author?: string;
  integrationStatus?: string;
  downloads?: number;
  rating?: number;
}

export default function Marketplace() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadItems() {
      try {
        const res = await fetch("/api/marketplace");
        if (res.ok) {
          const data = await res.json();
          setItems(data.items || []);
        }
      } catch {}
      setLoading(false);
    }
    loadItems();
  }, []);

  const filtered = filter === "all"
    ? items
    : filter === "skills"
    ? items.filter(i => i.type === "skill")
    : items.filter(i => i.type === "tool");

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white font-mono p-10">
        <p className="text-gray-400">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">🏪 PANDORA Marketplace</h1>
            <p className="text-gray-500 text-sm mt-1">
              Yetenekler ve araçlar — {items.length} öğe mevcut
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-400 hover:text-white">
              Ana Sayfa
            </Link>
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white">
              Dashboard
            </Link>
          </div>
        </div>

        {/* Filtreler */}
        <div className="flex gap-2 mb-6">
          {["all", "skills", "tools"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded text-sm ${
                filter === f
                  ? "bg-yellow-500 text-black font-bold"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {f === "all" ? "Tümü" : f === "skills" ? "🧠 Yetenekler" : "🛠️ Araçlar"}
            </button>
          ))}
        </div>

        {/* Öğeler */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 && (
            <p className="text-gray-500 col-span-3">Henüz öğe yok.</p>
          )}
          {filtered.map((item, i) => (
            <div
              key={i}
              className="bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-yellow-500 transition"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-sm">
                  {item.type === "skill" ? "🧠 " : "🛠️ "}
                  {item.name}
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  item.type === "skill"
                    ? "bg-purple-500/20 text-purple-400"
                    : "bg-blue-500/20 text-blue-400"
                }`}>
                  {item.type === "skill" ? "Yetenek" : "Araç"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                {item.description}
              </p>
              <div className="text-xs text-gray-600 space-y-1">
                {item.category && <p>📂 {item.category}</p>}
                {item.license && <p>📜 {item.license}</p>}
                {item.author && <p>👤 {item.author}</p>}
                <p>
                  {item.isFree !== undefined && (
                    item.isFree ? "🆓 Ücretsiz" : `💰 ${item.costDescription || "Ücretli"}`
                  )}
                </p>
                {item.integrationStatus && (
                  <p className={item.integrationStatus === "active" ? "text-green-400" : "text-yellow-400"}>
                    🔌 {item.integrationStatus === "active" ? "Entegre" : "Planlandı"}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}