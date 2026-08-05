"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Message {
  id?: string;
  role: "user" | "bee" | "pin";
  text: string;
  time: Date;
}

interface ChatRoom {
  id: string;
  name: string;
  type: string;
  messages?: { content: string; createdAt: string }[];
}

export default function Handbook() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pins, setPins] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showPins, setShowPins] = useState(false);
  const [editingRoom, setEditingRoom] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [pinInput, setPinInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadRooms(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => {
    if (activeRoom) { loadMessages(activeRoom); loadPins(activeRoom); }
  }, [activeRoom]);

  async function loadRooms() {
    try {
      const res = await fetch("/api/chat-rooms");
      if (res.ok) {
        const data = await res.json();
        setRooms(data);
        if (data.length > 0 && !activeRoom) setActiveRoom(data[0].id);
      }
    } catch {}
  }

  async function loadMessages(roomId: string) {
    try {
      const res = await fetch(`/api/chat-rooms/${roomId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.filter((m: any) => m.role !== "pin").map((m: any) => ({
          id: m.id, role: m.role, text: m.content, time: new Date(m.createdAt),
        })));
      }
    } catch {}
  }

  async function loadPins(roomId: string) {
    try {
      const res = await fetch(`/api/chat-rooms/${roomId}/pins`);
      if (res.ok) {
        const data = await res.json();
        setPins(data.map((p: any) => ({
          id: p.id, role: "pin", text: p.content, time: new Date(p.createdAt),
        })));
      }
    } catch {}
  }

  async function createRoom() {
    const name = prompt("Oda adı:");
    if (!name) return;
    try {
      const res = await fetch("/api/chat-rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type: "general" }),
      });
      if (res.ok) {
        const room = await res.json();
        setRooms(prev => [room, ...prev]);
        setActiveRoom(room.id);
      }
    } catch {}
  }

  async function deleteRoom(id: string) {
    if (!confirm("Bu odayı silmek istediğine emin misin?")) return;
    await fetch(`/api/chat-rooms/${id}`, { method: "DELETE" });
    setRooms(prev => prev.filter(r => r.id !== id));
    if (activeRoom === id) setActiveRoom(rooms[0]?.id || null);
  }

  async function renameRoom(id: string) {
    if (!editName.trim()) return;
    await fetch(`/api/chat-rooms/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName }),
    });
    setRooms(prev => prev.map(r => r.id === id ? { ...r, name: editName } : r));
    setEditingRoom(null);
  }

  async function addPin() {
    if (!pinInput.trim() || !activeRoom) return;
    const res = await fetch(`/api/chat-rooms/${activeRoom}/pins`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: pinInput }),
    });
    if (res.ok) {
      const pin = await res.json();
      setPins(prev => [{ id: pin.id, role: "pin", text: pin.content, time: new Date(pin.createdAt) }, ...prev]);
      setPinInput("");
    }
  }

  async function deletePin(pinId: string) {
    await fetch(`/api/chat-rooms/${activeRoom}/pins/${pinId}`, { method: "DELETE" });
    setPins(prev => prev.filter(p => p.id !== pinId));
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading || !activeRoom) return;

    const userMsg: Message = { role: "user", text: input, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    await fetch(`/api/chat-rooms/${activeRoom}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "user", content: input }),
    });
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: input }),
      });
      if (res.ok) {
        const data = await res.json();
        let beeText = data.result;
        if (typeof beeText === "object") {
          if (beeText.projectType || beeText.tasks) {
            beeText = "📋 **Proje Planı**\n\n**Tür:** " + (beeText.projectType || "?") + "\n**Görevler:**\n" + (beeText.tasks || []).map((t: any) => `  ${t.id}. ${t.title}`).join("\n");
          } else if (beeText.code || beeText.execution) {
            beeText = "✅ **Kod Üretildi** — " + (beeText.finalStatus || "");
          } else {
            beeText = JSON.stringify(beeText, null, 2);
          }
        }
        const beeMsg: Message = { role: "bee", text: beeText, time: new Date() };
        setMessages(prev => [...prev, beeMsg]);
        await fetch(`/api/chat-rooms/${activeRoom}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "bee", content: beeText }),
        });
      }
    } catch {} finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono flex h-screen">
      {/* Sol Panel */}
      {showSidebar && (
        <div className="w-64 border-r border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="font-bold text-sm">💬 Sohbetler</h2>
            <button onClick={() => setShowSidebar(false)} className="text-gray-500 hover:text-white text-xs">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {rooms.map(room => (
              <div key={room.id} className={`border-b border-gray-800 ${activeRoom === room.id ? "bg-gray-900 border-l-2 border-l-yellow-500" : ""}`}>
                {editingRoom === room.id ? (
                  <div className="p-2 flex gap-1">
                    <input value={editName} onChange={e => setEditName(e.target.value)} className="flex-1 bg-gray-700 text-white text-xs px-2 py-1 rounded" autoFocus />
                    <button onClick={() => renameRoom(room.id)} className="text-green-400 text-xs">✓</button>
                    <button onClick={() => setEditingRoom(null)} className="text-red-400 text-xs">✕</button>
                  </div>
                ) : (
                  <button onClick={() => setActiveRoom(room.id)} className="w-full text-left p-3 hover:bg-gray-900 transition">
                    <p className="text-sm font-bold truncate">{room.name}</p>
                    <p className="text-xs text-gray-500 truncate">{room.messages?.[0]?.content?.substring(0, 40) || "Yeni"}</p>
                  </button>
                )}
                <div className="flex justify-end gap-2 px-3 pb-2">
                  <button onClick={() => { setEditingRoom(room.id); setEditName(room.name); }} className="text-xs text-gray-500 hover:text-yellow-400">✏️</button>
                  <button onClick={() => deleteRoom(room.id)} className="text-xs text-gray-500 hover:text-red-400">🗑️</button>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-gray-800">
            <button onClick={createRoom} className="w-full bg-yellow-500 text-black text-sm font-bold py-2 rounded hover:bg-yellow-400">+ Yeni Sohbet</button>
          </div>
        </div>
      )}

      {/* Ana Alan */}
      <div className="flex-1 flex flex-col">
        <div className="border-b border-gray-800 p-4 flex items-center gap-4">
          {!showSidebar && <button onClick={() => setShowSidebar(true)} className="text-gray-500 hover:text-white text-sm">☰</button>}
          <Link href="/" className="text-gray-500 hover:text-white text-sm">← Ana Sayfa</Link>
          <h1 className="font-bold">🐝 BEE</h1>
          <button onClick={() => setVoiceOn(!voiceOn)} className={`text-xs ml-2 ${voiceOn ? "text-green-400" : "text-gray-500"}`}>{voiceOn ? "🔊" : "🔇"}</button>
          <button onClick={() => setShowPins(!showPins)} className={`text-xs ml-2 ${showPins ? "text-yellow-400" : "text-gray-500"}`}>📌 {pins.length}</button>
          <span className="text-xs text-green-400 ml-auto">● Çevrimiçi</span>
        </div>

        {/* Pano */}
        {showPins && (
          <div className="border-b border-gray-800 bg-gray-900/50 p-4">
            <h3 className="text-xs font-bold text-yellow-500 mb-2">📌 Sabitlenmiş Notlar</h3>
            <div className="flex gap-2 mb-3">
              <input value={pinInput} onChange={e => setPinInput(e.target.value)} placeholder="Yeni not ekle..." className="flex-1 bg-gray-800 border border-gray-700 text-white text-xs px-3 py-2 rounded" />
              <button onClick={addPin} className="bg-yellow-500 text-black text-xs px-3 py-2 rounded font-bold">Ekle</button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {pins.length === 0 && <p className="text-gray-500 text-xs">Henüz not yok.</p>}
              {pins.map(pin => (
                <div key={pin.id} className="bg-gray-800 rounded p-2 flex justify-between items-start">
                  <p className="text-xs text-gray-300">{pin.text}</p>
                  <button onClick={() => deletePin(pin.id!)} className="text-red-400 text-xs ml-2">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mesajlar */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && <p className="text-gray-500 text-center mt-10">{activeRoom ? "Bir şey sor!" : "Soldan sohbet seç."}</p>}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${msg.role === "user" ? "bg-yellow-500 text-black rounded-br-md" : "bg-gray-800 text-gray-200 rounded-bl-md"}`}>
                <div className="whitespace-pre-wrap">{msg.text}</div>
                <div className={`text-xs mt-1 ${msg.role === "user" ? "text-black/50" : "text-gray-500"}`}>{msg.time.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
            </div>
          ))}
          {loading && <div className="flex justify-start"><div className="bg-gray-800 text-gray-400 px-4 py-3 rounded-2xl rounded-bl-md text-sm">Yazıyor...</div></div>}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="border-t border-gray-800 p-4">
          <div className="flex gap-2">
            <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Bir şey sor..." className="flex-1 bg-gray-900 border border-gray-700 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-yellow-500" />
            <button type="submit" disabled={loading || !activeRoom} className="bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-yellow-400 disabled:opacity-50">Gönder</button>
          </div>
        </form>
      </div>
    </div>
  );
}