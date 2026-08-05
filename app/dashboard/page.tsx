"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { requestNotificationPermission } from "@/lib/notifications";

interface SystemStatus {
  emergencyMode: boolean;
  lockdownReason: string;
}

interface AIRegistryItem {
  modelName: string;
  provider: string;
  status: string;
  costPer1MTokens: string;
}

interface ToolRegistryItem {
  toolName: string;
  category: string;
  integrationStatus: string;
}

interface DailyReport {
  date: string;
  summary: {
    totalConversations: number;
    totalDocuments: number;
    activeLearningRecords: number;
  };
  systemStatus: {
    database: string;
    deepseek: string;
    serper: string;
    vault: string;
  };
}

interface GameProject {
  id: string;
  title: string;
  status: string;
}

interface RecoveryPoint {
  id: string;
  label: string;
  createdAt: string;
}

export default function Dashboard() {
  const [emergency, setEmergency] = useState<SystemStatus | null>(null);
  const [aiModels, setAiModels] = useState<AIRegistryItem[]>([]);
  const [tools, setTools] = useState<ToolRegistryItem[]>([]);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [projects, setProjects] = useState<GameProject[]>([]);
  const [recovery, setRecovery] = useState<RecoveryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [emergencyRes, aiRes, toolRes, reportRes, projRes, recRes] = await Promise.all([
          fetch("/api/emergency"),
          fetch("/api/ai-registry"),
          fetch("/api/tool-registry"),
          fetch("/api/cron/daily-report"),
          fetch("/api/game-department"),
          fetch("/api/recovery"),
        ]);
        if (emergencyRes.ok) setEmergency(await emergencyRes.json());
        if (aiRes.ok) setAiModels(await aiRes.json());
        if (toolRes.ok) setTools(await toolRes.json());
        if (reportRes.ok) setReport(await reportRes.json());
        if (projRes.ok) setProjects(await projRes.json());
        if (recRes.ok) setRecovery(await recRes.json());
      } catch {}
      setLoading(false);
    }
    loadData();

    // Strategy analizini yükle
    fetch("/api/strategy")
      .then(res => res.json())
      .then(data => {
        const panel = document.getElementById("strategy-panel");
        if (panel && data.overallHealth) {
          panel.innerHTML = `
            <div class="mb-3">
              <span class="text-gray-400">Genel Durum:</span>
              <span class="font-bold ${data.overallHealth.includes('Mükemmel') ? 'text-green-400' : data.overallHealth.includes('İyi') ? 'text-yellow-400' : 'text-red-400'}">${data.overallHealth}</span>
            </div>
            <div class="mb-3">
              <span class="text-gray-400">Proje Özeti:</span>
              <span class="text-gray-300">${data.projectInsights}</span>
            </div>
            ${data.bottlenecks?.length > 0 ? `<div class="mb-2"><span class="text-red-400">⚠️ Darboğazlar:</span><ul class="list-disc list-inside text-xs text-gray-400 mt-1">${data.bottlenecks.map((b: string) => `<li>${b}</li>`).join("")}</ul></div>` : ""}
            ${data.recommendations?.length > 0 ? `<div><span class="text-yellow-400">💡 Öneriler:</span><ul class="list-disc list-inside text-xs text-gray-400 mt-1">${data.recommendations.map((r: string) => `<li>${r}</li>`).join("")}</ul></div>` : ""}
          `;
        }
      })
      .catch(() => {
        const panel = document.getElementById("strategy-panel");
        if (panel) panel.innerHTML = '<p class="text-red-400">Analiz alınamadı.</p>';
      });

    // Bildirimleri yükle
    fetch("/api/notifications")
      .then(res => res.json())
      .then(notifs => {
        const panel = document.getElementById("notif-center");
        if (panel && notifs.length > 0) {
          panel.innerHTML = notifs.slice(0, 20).map((n: any) => `
            <div class="flex items-start gap-3 bg-gray-800 rounded p-3 text-xs">
              <span class="text-lg">${n.icon}</span>
              <div class="flex-1">
                <p class="font-bold text-gray-300">${n.title}</p>
                <p class="text-gray-500">${n.detail || ""}</p>
              </div>
              <span class="text-gray-600 whitespace-nowrap">${new Date(n.time).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          `).join("");
        } else if (panel && notifs.length === 0) {
          panel.innerHTML = '<p class="text-gray-500 text-sm">Henüz bildirim yok.</p>';
        }
      })
      .catch(() => {
        const panel = document.getElementById("notif-center");
        if (panel) panel.innerHTML = '<p class="text-red-400">Bildirimler alınamadı.</p>';
      });

    // Proje yönetim verilerini yükle
    fetch("/api/project-manager")
      .then(res => res.json())
      .then(data => {
        const panel = document.getElementById("project-manager-panel");
        if (panel && data.totalProjects) {
          panel.innerHTML = `
            <div class="grid grid-cols-3 gap-4 mb-4">
              <div class="bg-gray-800 rounded p-3 text-center">
                <p class="text-2xl font-bold text-green-400">${data.totalProjects}</p>
                <p class="text-xs text-gray-500">Toplam Proje</p>
              </div>
              <div class="bg-gray-800 rounded p-3 text-center">
                <p class="text-2xl font-bold text-yellow-400">${data.activeProjects}</p>
                <p class="text-xs text-gray-500">Aktif Proje</p>
              </div>
              <div class="bg-gray-800 rounded p-3 text-center">
                <p class="text-2xl font-bold text-purple-400">${(data.totalTokenEstimate || 0).toLocaleString()}</p>
                <p class="text-xs text-gray-500">Tahmini Token</p>
              </div>
            </div>
            <div class="space-y-2 max-h-40 overflow-y-auto">
              ${data.projects?.map((p: any) => `
                <div class="bg-gray-800 rounded p-3 flex items-center justify-between text-xs">
                  <div>
                    <span class="font-bold">${p.name}</span>
                    <span class="text-gray-500 ml-2">${p.type === "game" ? "🎮" : "💬"} ${p.type}</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="${p.status === "active" ? "text-green-400" : "text-yellow-400"}">${p.status}</span>
                    <span class="text-gray-500">${p.messageCount} msj</span>
                    <span class="text-gray-600">~${p.tokenUsage.toLocaleString()} token</span>
                  </div>
                </div>
              `).join("") || '<p class="text-gray-500">Henüz proje yok.</p>'}
            </div>
          `;
        }
      })
      .catch(() => {
        const panel = document.getElementById("project-manager-panel");
        if (panel) panel.innerHTML = '<p class="text-red-400">Proje verileri alınamadı.</p>';
      });

    // Bildirim izin durumunu kontrol et
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifEnabled(Notification.permission === "granted");
    }
  }, []);

  const handleNotificationRequest = async () => {
    const granted = await requestNotificationPermission();
    setNotifEnabled(granted);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white font-mono p-10">
        <p className="text-gray-400">Yükleniyor...</p>
      </div>
    );
  }

  const activeProjects = projects.filter(p => p.status === "active").length;
  const totalConversations = report?.summary?.totalConversations || 0;
  const activeLearnings = report?.summary?.activeLearningRecords || 0;

  return (
    <div className="min-h-screen bg-black text-white font-mono p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">🖥️ PANDORA Kontrol Merkezi</h1>
            <p className="text-gray-500 text-sm mt-1">
              {report?.date ? `Son rapor: ${report.date}` : "Henüz rapor yok"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleNotificationRequest}
              className={`text-xs px-3 py-1 rounded border ${
                notifEnabled
                  ? "border-green-500 text-green-400"
                  : "border-gray-600 text-gray-400 hover:border-yellow-500"
              }`}
            >
              {notifEnabled ? "🔔 Bildirimler Açık" : "🔕 Bildirimleri Aç"}
            </button>
            <Link
              href="/handbook"
              className="text-sm text-yellow-500 hover:text-yellow-400 border border-yellow-500 px-4 py-2 rounded"
            >
              🐝 BEE ile Sohbet
            </Link>
            <Link
              href="/studio"
              className="text-sm text-yellow-500 hover:text-yellow-400 border border-yellow-500 px-4 py-2 rounded"
            >
              🎮 Studio
            </Link>
            <Link
              href="/"
              className="text-sm text-gray-400 hover:text-white"
            >
              Ana Sayfa
            </Link>
          </div>
        </div>

        {/* Acil Durum Uyarısı */}
        {emergency?.emergencyMode && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-8 animate-pulse">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⛔</span>
              <div>
                <h2 className="text-red-400 font-bold">ACİL DURUM KİLİDİ AKTİF</h2>
                <p className="text-red-300 text-sm">{emergency.lockdownReason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Sistem Durumu Kartları */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Veritabanı</p>
            <p className="text-lg font-bold text-green-400">
              {report?.systemStatus?.database === "Online" ? "✅ Online" : "❌ Offline"}
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">DeepSeek</p>
            <p className="text-lg font-bold text-green-400">
              {report?.systemStatus?.deepseek === "Connected" ? "✅ Bağlı" : "❌ Kopuk"}
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Serper (Web)</p>
            <p className="text-lg font-bold text-green-400">
              {report?.systemStatus?.serper === "Connected" ? "✅ Bağlı" : "❌ Kopuk"}
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Vault</p>
            <p className="text-lg font-bold text-green-400">
              {report?.systemStatus?.vault === "Connected" ? "✅ Güvende" : "❌ Kopuk"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Bugünün İstatistikleri */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-sm font-bold text-yellow-500 mb-4">📊 Bugün</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Konuşmalar</span>
                <span className="font-bold">{totalConversations}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Aktif Öğrenme Kaydı</span>
                <span className="font-bold">{activeLearnings}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Oyun Projeleri</span>
                <span className="font-bold">{projects.length} ({activeProjects} aktif)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Kurtarma Noktaları</span>
                <span className="font-bold">{recovery.length}</span>
              </div>
            </div>
          </div>

          {/* Son Kurtarma Noktaları */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-sm font-bold text-yellow-500 mb-4">🔄 Son Kurtarma Noktaları</h2>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {recovery.length === 0 && <p className="text-gray-500 text-sm">Henüz yok.</p>}
              {recovery.slice(0, 5).map(r => (
                <div key={r.id} className="text-xs text-gray-400 flex justify-between">
                  <span>{r.label}</span>
                  <span>{new Date(r.createdAt).toLocaleString("tr-TR")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Proje Yönetim Paneli */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-sm font-bold text-yellow-500 mb-4">📂 Proje Yönetimi</h2>
          <div className="space-y-3 text-sm" id="project-manager-panel">
            <p className="text-gray-400">Yükleniyor...</p>
          </div>
        </div>

        {/* Bildirim Merkezi */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-sm font-bold text-yellow-500 mb-4">🔔 Bildirim Merkezi</h2>
          <div className="space-y-2 max-h-60 overflow-y-auto" id="notif-center">
            <p className="text-gray-400 text-sm">Yükleniyor...</p>
          </div>
        </div>

        {/* AI Modelleri ve Araçlar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-sm font-bold text-yellow-500 mb-4">🤖 AI Modelleri ({aiModels.length})</h2>
            <div className="space-y-2">
              {aiModels.map(ai => (
                <div key={ai.modelName} className="flex justify-between text-xs">
                  <span>{ai.modelName} <span className="text-gray-500">({ai.provider})</span></span>
                  <span className={ai.status === "active" ? "text-green-400" : "text-red-400"}>
                    {ai.status} | {ai.costPer1MTokens}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-sm font-bold text-yellow-500 mb-4">🛠️ Araçlar ({tools.length})</h2>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {tools.map(tool => (
                <div key={tool.toolName} className="flex justify-between text-xs">
                  <span>{tool.toolName} <span className="text-gray-500">({tool.category})</span></span>
                  <span className={tool.integrationStatus === "active" ? "text-green-400" : "text-yellow-400"}>
                    {tool.integrationStatus}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stratejik Analiz Paneli */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-sm font-bold text-purple-400 mb-4">🧠 Stratejik Analiz</h2>
          <div className="space-y-3 text-sm" id="strategy-panel">
            <p className="text-gray-400">Yükleniyor...</p>
          </div>
        </div>

        {/* Oyun Projeleri */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-sm font-bold text-yellow-500 mb-4">🎮 Oyun Projeleri ({projects.length})</h2>
          {projects.length === 0 ? (
            <p className="text-gray-500 text-sm">Henüz proje yok.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {projects.map(p => (
                <div key={p.id} className="bg-black/30 rounded p-3 border border-gray-800">
                  <p className="text-sm font-bold">{p.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    p.status === "active" ? "bg-green-500/20 text-green-400" :
                    p.status === "planning" ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-gray-500/20 text-gray-400"
                  }`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}