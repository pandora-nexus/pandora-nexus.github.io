"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Room {
  id: string;
  name: string;
  players: string[];
  maxPlayers: number;
}

interface LeaderboardEntry {
  username: string;
  highScore: number;
  totalGames: number;
}

export default function GameLobby() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [username, setUsername] = useState("patron");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadRooms();
    loadLeaderboard();
  }, []);

  async function loadRooms() {
    try {
      const res = await fetch("/api/socket");
      if (res.ok) {
        const data = await res.json();
        setRooms(data);
      }
    } catch {}
  }

  async function loadLeaderboard() {
    try {
      const res = await fetch("/api/leaderboard");
      if (res.ok) {
        setLeaderboard(await res.json());
      }
    } catch {}
  }

  async function createRoom() {
    if (!newRoomName.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/socket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", name: newRoomName, maxPlayers }),
      });
      if (res.ok) {
        const room = await res.json();
        setMessage(`✅ "${room.name}" odası oluşturuldu! ID: ${room.id}`);
        setNewRoomName("");
        loadRooms();
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  async function joinRoom(roomId: string) {
    try {
      const res = await fetch("/api/socket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", roomId, username }),
      });
      if (res.ok) {
        const room = await res.json();
        setMessage(`✅ "${room.name}" odasına katıldın!`);
        loadRooms();
      } else {
        const err = await res.json();
        setMessage(`❌ ${err.error}`);
      }
    } catch {}
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">🎮 Oyun Lobisi</h1>
            <p className="text-gray-500 text-sm mt-1">Oda oluştur, arkadaşlarını davet et, oyna!</p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white">Dashboard</Link>
            <Link href="/" className="text-sm text-gray-400 hover:text-white">Ana Sayfa</Link>
          </div>
        </div>

        {/* Mesaj */}
        {message && (
          <div className={`p-3 rounded mb-4 text-sm ${message.startsWith("✅") ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
            {message}
          </div>
        )}

        {/* Oda Oluştur */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-bold text-yellow-500 mb-4">+ Yeni Oyun Odası</h2>
          <div className="flex gap-3 flex-wrap">
            <input
              type="text"
              value={newRoomName}
              onChange={e => setNewRoomName(e.target.value)}
              placeholder="Oda adı..."
              className="flex-1 min-w-[200px] bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-lg text-sm focus:outline-none focus:border-yellow-500"
            />
            <select
              value={maxPlayers}
              onChange={e => setMaxPlayers(Number(e.target.value))}
              className="bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-lg text-sm"
            >
              {[2, 3, 4, 6, 8].map(n => (
                <option key={n} value={n}>{n} Oyuncu</option>
              ))}
            </select>
            <button
              onClick={createRoom}
              disabled={loading}
              className="bg-yellow-500 text-black px-6 py-3 rounded-lg font-bold text-sm hover:bg-yellow-400 disabled:opacity-50"
            >
              Oda Oluştur
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Aktif Odalar */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-bold text-yellow-500 mb-4">🟢 Aktif Odalar ({rooms.length})</h2>
            {rooms.length === 0 && <p className="text-gray-500 text-sm">Henüz oda yok.</p>}
            <div className="space-y-3">
              {rooms.map(room => (
                <div key={room.id} className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">{room.name}</p>
                    <p className="text-xs text-gray-500">ID: {room.id} | {room.players.length}/{room.maxPlayers} oyuncu</p>
                  </div>
                  <button
                    onClick={() => joinRoom(room.id)}
                    disabled={room.players.length >= room.maxPlayers}
                    className={`px-4 py-2 rounded text-xs font-bold ${
                      room.players.length >= room.maxPlayers
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-green-500 text-black hover:bg-green-400"
                    }`}
                  >
                    {room.players.length >= room.maxPlayers ? "Dolu" : "Katıl"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Liderlik Tablosu */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-bold text-yellow-500 mb-4">🏆 Liderlik Tablosu</h2>
            {leaderboard.length === 0 && <p className="text-gray-500 text-sm">Henüz skor yok.</p>}
            <div className="space-y-2">
              {leaderboard.map((entry, i) => (
                <div key={entry.username} className="bg-gray-800 rounded-lg p-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className={`text-lg ${i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-orange-400" : "text-gray-500"}`}>
                      {i + 1}.
                    </span>
                    <span className="font-bold">{entry.username}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400">{entry.highScore.toLocaleString()} puan</p>
                    <p className="text-xs text-gray-500">{entry.totalGames} oyun</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}